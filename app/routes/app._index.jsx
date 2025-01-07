import { authenticate } from "../shopify.server";
import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";


export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return null;
};
export default function Index() {
  const navigate = useNavigate();
  useEffect(()=>{
    navigate("/app/plans")
  }, [])

  return(
    <>
    </>
  )
}
