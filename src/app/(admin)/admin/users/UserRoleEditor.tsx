"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface UserRoleEditorProps {
  userId: string;
  currentRole: string;
}

export function UserRoleEditor({ userId, currentRole }: UserRoleEditorProps) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (newRole: string) => {
    setRole(newRole);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Role updated");
      router.refresh();
    } catch {
      toast.error("Failed to update role");
      setRole(currentRole);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <select
      value={role}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isSaving}
      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
    >
      <option value="VIEWER">VIEWER</option>
      <option value="EDITOR">EDITOR</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  );
}
