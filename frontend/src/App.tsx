import { Router } from "@/router";
import { DialogProvider } from "@/components/ui/DialogProvider";
import { AuthProvider } from "@/providers/AuthProvider";

export default function App() {
  return (
    <AuthProvider>
      <DialogProvider />
      <Router />
    </AuthProvider>
  );
}
