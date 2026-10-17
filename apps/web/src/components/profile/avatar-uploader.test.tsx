import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AvatarUploader } from "./avatar-uploader";

describe("AvatarUploader", () => {
  const user = {
    givenName: "Juan",
    familyName: "Pérez",
    avatarUrl: null,
  };

  it("renders correctly", () => {
    render(<AvatarUploader user={user} />);
    expect(screen.getByLabelText("Cambiar foto")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Quitar foto/i })).toBeNull();
  });

  it("shows remove button if there is a preview url", () => {
    const userWithPhoto = { ...user, avatarUrl: "data:image/png;base64,123" };
    render(<AvatarUploader user={userWithPhoto} />);
    expect(screen.getByRole("button", { name: /Quitar foto/i })).toBeDefined();
  });

  it("removes preview url when clicking remove", () => {
    const userWithPhoto = { ...user, avatarUrl: "data:image/png;base64,123" };
    render(<AvatarUploader user={userWithPhoto} />);

    const removeBtn = screen.getByRole("button", { name: /Quitar foto/i });
    fireEvent.click(removeBtn);

    expect(screen.queryByRole("button", { name: /Quitar foto/i })).toBeNull();
    // Hidden input should be empty
    const hiddenInput = document.querySelector('input[name="avatarUrl"]') as HTMLInputElement;
    expect(hiddenInput.value).toBe("");
  });

  it("previews a valid PNG file and stores it in the hidden input", async () => {
    render(<AvatarUploader user={user} />);

    const file = new File(["png"], "foto.png", { type: "image/png" });
    const input = screen.getByLabelText("Cambiar foto") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const hiddenInput = document.querySelector('input[name="avatarUrl"]') as HTMLInputElement;
      expect(hiddenInput.value.startsWith("data:image/png")).toBe(true);
    });
    expect(screen.queryByText("La foto debe ser un archivo PNG o JPG.")).toBeNull();
  });

  it("rejects an invalid file type and announces the error", () => {
    render(<AvatarUploader user={user} />);

    const file = new File(["pdf"], "documento.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText("Cambiar foto") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("La foto debe ser un archivo PNG o JPG.")).toBeInTheDocument();
    expect(input.value).toBe("");
  });

  it("rejects a file larger than 5 MB", () => {
    render(<AvatarUploader user={user} />);

    const big = new File([new ArrayBuffer(6 * 1024 * 1024)], "grande.png", {
      type: "image/png",
    });
    const input = screen.getByLabelText("Cambiar foto") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [big] } });

    expect(screen.getByText("La foto no puede superar los 5 MB.")).toBeInTheDocument();
  });

  it("ignores the change event when no file is selected", () => {
    render(<AvatarUploader user={user} />);

    const input = screen.getByLabelText("Cambiar foto") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });

    expect(screen.getByText("PNG o JPG, máximo 5 MB.")).toBeInTheDocument();
  });
});
