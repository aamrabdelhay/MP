import { AlertCircle, Check } from "lucide-react";

export function Toast({ message, type = "success" }: { message: string; type?: "success" | "error" }) {
  return (
    <div className={`admin-toast${type === "error" ? " admin-toast--error" : ""}`} role={type === "error" ? "alert" : "status"}>
      {type === "error" ? <AlertCircle aria-hidden="true" size={17} /> : <Check aria-hidden="true" size={17} />}
      <span>{message}</span>
    </div>
  );
}
