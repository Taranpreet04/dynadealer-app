// app/routes/yourRoute.jsx or .tsx
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useSubmit } from "@remix-run/react";
import { updateDb } from "../controllers/planController";

// Loader
export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);

  // Optional logic if needed
  return json({});
};

// Action
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  console.log("Received POST data:", data);

  const res = await updateDb(admin, data);
  // if (res.success) {
  return json({ message: "success" });
  // } else {
  //   return json({ message: "failed" });
  // }
};

// Component
export default function PlanData() {
  const submit = useSubmit();

  const handleClick = () => {
    submit(
      { skip: "0", limit: "5" }, // Make sure values are strings
      { method: "post" }
    );
  };

  return (
    <div>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}
