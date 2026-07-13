import { Router } from "@/router";
import { DialogProvider } from "@/components/ui/DialogProvider";

export default function App() {
  return (
    <>
      <DialogProvider />
      <Router />
    </>
  );
}
