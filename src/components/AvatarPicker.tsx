import { useRef, useState, type ChangeEvent } from "react";
import { AVATAR_MAX_BYTES, prepareAvatar } from "../auth/avatarImage";
import { describeError } from "../auth/errors";
import { removeAvatar, saveAvatar, useAvatar } from "../auth/useAvatar";

const avatarErrors = {
  "avatar-too-large": "A imagem é demasiado grande. Escolhe outra.",
  "invalid-image": "Essa imagem não deu. Escolhe uma fotografia JPEG, PNG ou WebP.",
};

/**
 * O avatar da página da conta: a fotografia (ou a inicial) e os botões para a
 * mudar ou tirar. A imagem é cortada ao quadrado e reduzida no browser antes de ir.
 */
export function AvatarPicker({ userId, email }: { userId: string; email: string }) {
  const avatar = useAvatar();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      let image: Blob;
      try {
        image = await prepareAvatar(file);
      } catch {
        setError("Não foi possível abrir essa imagem. Escolhe uma fotografia.");
        return;
      }
      if (image.size > AVATAR_MAX_BYTES) {
        setError(avatarErrors["avatar-too-large"]);
        return;
      }
      await saveAvatar(userId, image);
    } catch (err) {
      setError(describeError(err, avatarErrors));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError(null);
    setBusy(true);
    try {
      await removeAvatar(userId);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="avatar-picker">
      <button
        type="button"
        className={`profile-avatar${avatar ? " has-photo" : ""}`}
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={avatar ? "Mudar a fotografia" : "Pôr uma fotografia"}
      >
        {avatar ? <img src={avatar} alt="" /> : email.charAt(0).toUpperCase()}
        <span className="avatar-picker-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M4 8h3l2-3h6l2 3h3v11H4z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={choose} />
      <div className="avatar-picker-actions">
        <button type="button" className="link-button" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "A guardar…" : avatar ? "Mudar fotografia" : "Pôr fotografia"}
        </button>
        {avatar && !busy && (
          <button type="button" className="link-button" onClick={remove}>
            Remover
          </button>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
