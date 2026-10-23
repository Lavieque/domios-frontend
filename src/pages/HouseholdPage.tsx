import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getHousehold, memberRoleLabels, type HouseholdDto } from "../api/households";
import { describeError } from "../auth/errors";
import { useHouseholds } from "../household/useHouseholds";

export function HouseholdPage() {
  const { loading, error, households, current, select } = useHouseholds();
  const [household, setHousehold] = useState<HouseholdDto | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const currentId = current?.householdId ?? null;
  useEffect(() => {
    if (!currentId) return;
    let cancelled = false;
    setHousehold(null);
    setDetailError(null);
    getHousehold(currentId)
      .then((result) => !cancelled && setHousehold(result))
      .catch((err: unknown) => !cancelled && setDetailError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  if (loading) {
    return <p className="muted loading">A carregar…</p>;
  }
  if (error) {
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  }
  if (households.length === 0) {
    return <Navigate to="/casa/nova" replace />;
  }

  return (
    <div className="page">
      <p className="eyebrow">Casa</p>
      <h1>{current?.name}</h1>
      {current && <p className="muted">És {memberRoleLabels[current.role].toLowerCase()} desta casa.</p>}

      {households.length > 1 && (
        <select
          className="category-select"
          aria-label="Escolher casa"
          value={currentId ?? ""}
          onChange={(e) => select(e.target.value)}
        >
          {households.map((h) => (
            <option key={h.householdId} value={h.householdId}>
              {h.name}
            </option>
          ))}
        </select>
      )}

      {detailError && (
        <p className="form-error" role="alert">
          {detailError}
        </p>
      )}

      {household && (
        <>
          <h2>Membros</h2>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Papel</th>
                <th>Conta</th>
              </tr>
            </thead>
            <tbody>
              {household.members.map((member) => (
                <tr key={member.memberId}>
                  <td>
                    {member.name}
                    {member.memberId === current?.memberId && <span className="muted"> (tu)</span>}
                  </td>
                  <td>{memberRoleLabels[member.role]}</td>
                  <td className="muted">{member.userId ? "Com conta" : "Sem conta"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <p className="form-links">
        <Link to="/casa/nova">Criar outra casa</Link>
      </p>
    </div>
  );
}
