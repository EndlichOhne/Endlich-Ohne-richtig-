import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/akte")({
  component: () => <Outlet />,
});
