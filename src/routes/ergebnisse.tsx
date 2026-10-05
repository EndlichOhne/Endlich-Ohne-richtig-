import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/ergebnisse")({
  component: () => <Outlet />,
});
