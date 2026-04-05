import { CreateUserClient } from "./create-user-client";

export const metadata = {
  title: "Create user | CRM",
  description: "Create a user in your organization",
};

export default function CreateUserPage() {
  return <CreateUserClient />;
}
