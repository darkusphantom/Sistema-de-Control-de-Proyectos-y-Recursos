"use client";

import { useEffect, useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import { buttonStyles } from "@/components/ui/button";

export type ConfirmRoleDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username: string;
  currentRole: string;
  newRole: string;
  isPending?: boolean;
};

export function ConfirmRoleDialog({
  open,
  onClose,
  onConfirm,
  username,
  currentRole,
  newRole,
  isPending,
}: ConfirmRoleDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy="confirm-role-dialog-title"
      width="md"
      footer={
        <>
          <button
            ref={cancelRef}
            className={buttonStyles({ variant: "secondary" })}
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </button>
          <button
            className={buttonStyles({ variant: "primary" })}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Confirmando…" : "Confirmar"}
          </button>
        </>
      }
    >
      <div className="flex flex-col pt-4">
        <h2 id="confirm-role-dialog-title" className="text-xl font-semibold mb-4 text-text">
          Confirmar cambio de rol
        </h2>
        <p className="text-base text-text-muted">
          {`¿Cambiar el rol de @${username} de "${currentRole}" a "${newRole}"?`}
        </p>
      </div>
    </Dialog>
  );
}
