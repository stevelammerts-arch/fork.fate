"""Admin passkey (WebAuthn / FIDO2) login: register a platform authenticator
(fingerprint / FaceID) gated by the existing admin JWT, then log in with it to
receive the same admin session token. Password login stays as a fallback."""
import json
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel

from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url
from webauthn.helpers.structs import (
    PublicKeyCredentialDescriptor,
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
    UserVerificationRequirement,
    AuthenticatorAttachment,
)

from core import db, rate_limit, require_admin, create_admin_token, rp_id_and_origin

router = APIRouter()

ADMIN_KEY = "admin"
USER_HANDLE = b"fork-fate-admin"


async def _get_doc():
    return await db.admin_auth.find_one({"_id": ADMIN_KEY}) or {"_id": ADMIN_KEY, "passkeys": []}


class VerifyPayload(BaseModel):
    response: dict


# ── Registration (gated by admin JWT) ──────────────────────────────────────
@router.get("/admin/passkey/register-options", dependencies=[Depends(require_admin)])
async def register_options(request: Request):
    rp_id, _ = rp_id_and_origin(request)
    doc = await _get_doc()
    exclude = [
        PublicKeyCredentialDescriptor(id=base64url_to_bytes(pk["credential_id"]))
        for pk in doc.get("passkeys", [])
    ]
    options = generate_registration_options(
        rp_id=rp_id,
        rp_name="Fork·Fate Admin",
        user_id=USER_HANDLE,
        user_name="admin",
        user_display_name="Fork·Fate Admin",
        exclude_credentials=exclude,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
    )
    await db.admin_auth.update_one(
        {"_id": ADMIN_KEY},
        {"$set": {"reg_challenge": bytes_to_base64url(options.challenge)}},
        upsert=True,
    )
    return json.loads(options_to_json(options))


@router.post("/admin/passkey/register-verify", dependencies=[Depends(require_admin)])
async def register_verify(payload: VerifyPayload, request: Request):
    rp_id, origin = rp_id_and_origin(request)
    doc = await _get_doc()
    challenge = doc.get("reg_challenge")
    if not challenge:
        raise HTTPException(status_code=400, detail="No pending registration challenge")
    try:
        verification = verify_registration_response(
            credential=payload.response,
            expected_challenge=base64url_to_bytes(challenge),
            expected_rp_id=rp_id,
            expected_origin=origin,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Passkey registration failed: {e}")

    new_passkey = {
        "credential_id": bytes_to_base64url(verification.credential_id),
        "public_key": bytes_to_base64url(verification.credential_public_key),
        "sign_count": verification.sign_count,
    }
    await db.admin_auth.update_one(
        {"_id": ADMIN_KEY},
        {"$push": {"passkeys": new_passkey}, "$unset": {"reg_challenge": ""}},
        upsert=True,
    )
    return {"ok": True}


@router.get("/admin/passkey/status", dependencies=[Depends(require_admin)])
async def passkey_status():
    doc = await _get_doc()
    return {"registered": len(doc.get("passkeys", [])) > 0, "count": len(doc.get("passkeys", []))}


@router.delete("/admin/passkey", dependencies=[Depends(require_admin)])
async def passkey_remove():
    await db.admin_auth.update_one({"_id": ADMIN_KEY}, {"$set": {"passkeys": []}}, upsert=True)
    return {"ok": True}


# ── Authentication (public, issues the admin JWT) ──────────────────────────
@router.get("/auth/passkey/available")
async def passkey_available():
    """Lets the login screen decide whether to show the passkey button."""
    doc = await _get_doc()
    return {"available": len(doc.get("passkeys", [])) > 0}


@router.get("/auth/passkey/login-options", dependencies=[Depends(rate_limit(20))])
async def login_options(request: Request):
    rp_id, _ = rp_id_and_origin(request)
    doc = await _get_doc()
    passkeys = doc.get("passkeys", [])
    if not passkeys:
        raise HTTPException(status_code=400, detail="No passkey registered")
    options = generate_authentication_options(
        rp_id=rp_id,
        allow_credentials=[
            PublicKeyCredentialDescriptor(id=base64url_to_bytes(pk["credential_id"]))
            for pk in passkeys
        ],
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    await db.admin_auth.update_one(
        {"_id": ADMIN_KEY},
        {"$set": {"auth_challenge": bytes_to_base64url(options.challenge)}},
        upsert=True,
    )
    return json.loads(options_to_json(options))


@router.post("/auth/passkey/login-verify", dependencies=[Depends(rate_limit(20))])
async def login_verify(payload: VerifyPayload, request: Request):
    rp_id, origin = rp_id_and_origin(request)
    doc = await _get_doc()
    challenge = doc.get("auth_challenge")
    if not challenge:
        raise HTTPException(status_code=400, detail="No pending login challenge")
    cred_id = payload.response.get("id") or payload.response.get("rawId")
    matched = next((pk for pk in doc.get("passkeys", []) if pk["credential_id"] == cred_id), None)
    if not matched:
        raise HTTPException(status_code=400, detail="Unknown passkey")
    try:
        verification = verify_authentication_response(
            credential=payload.response,
            expected_challenge=base64url_to_bytes(challenge),
            expected_rp_id=rp_id,
            expected_origin=origin,
            credential_public_key=base64url_to_bytes(matched["public_key"]),
            credential_current_sign_count=matched["sign_count"],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Passkey login failed: {e}")

    await db.admin_auth.update_one(
        {"_id": ADMIN_KEY, "passkeys.credential_id": cred_id},
        {"$set": {"passkeys.$.sign_count": verification.new_sign_count}, "$unset": {"auth_challenge": ""}},
    )
    return {"token": create_admin_token()}
