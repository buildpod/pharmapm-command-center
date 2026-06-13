"use client";

import { useEffect, useState } from "react";
import type { GuidanceRole } from "@/lib/guidance/guided-work";
import { guidanceRoleLabel } from "@/lib/guidance/guided-work";

export const GUIDANCE_ROLE_KEY = "aivello_guidance_role_v1";
export const GUIDANCE_ROLE_EVENT = "aivello:guidance-role-change";

const roles: GuidanceRole[] = ["pm", "sponsor", "qa"];

function readRole(): GuidanceRole {
  try {
    const stored = window.localStorage.getItem(GUIDANCE_ROLE_KEY);
    return roles.includes(stored as GuidanceRole) ? stored as GuidanceRole : "pm";
  } catch {
    return "pm";
  }
}

export function RoleSelector() {
  const [role, setRole] = useState<GuidanceRole>("pm");

  useEffect(() => {
    setRole(readRole());
  }, []);

  function updateRole(nextRole: GuidanceRole) {
    setRole(nextRole);
    try {
      window.localStorage.setItem(GUIDANCE_ROLE_KEY, nextRole);
      window.dispatchEvent(new CustomEvent(GUIDANCE_ROLE_EVENT, { detail: nextRole }));
    } catch {}
  }

  return (
    <label className="guidance-role" title="Guidance mode">
      <span>Mode</span>
      <select
        value={role}
        onChange={(event) => updateRole(event.target.value as GuidanceRole)}
        aria-label="Guidance mode"
      >
        {roles.map((item) => (
          <option key={item} value={item}>{guidanceRoleLabel(item)}</option>
        ))}
      </select>
    </label>
  );
}
