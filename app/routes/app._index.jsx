import { useActionData, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import TableSkeleton from "../components/tableSkeleton";
import {
  Button,
  Page,
  Card,
  EmptyState,
  IndexTable,
  Link,
  EmptySearchResult,
  InlineStack,
  Icon,
  useIndexResourceState,
  Text,
  Box,
  DataTable,
  Modal,
  BlockStack,
  Spinner,
  TextField,
  Grid,
  ChoiceList,
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import { DeleteIcon } from "@shopify/polaris-icons";

import React from "react";
// import {
//   updateRaffleProducts,
//   getRaffleProducts,
// } from "../controllers/planController";
import { Knob } from "../components/knob";
// import { sendMailToAll } from "../db.mailcontroller";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  // let data = await getRaffleProducts(admin);
  // return { data: data?.data };
  return null
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.formData();
  // let products = JSON.parse(body.get("products"));
  // let data = JSON.parse(body.get("data"));
  // if (products) {
  //   let res = await updateRaffleProducts(admin, products);
  //   return { message: "success", data: res };
  // } else if (data) {
  //   console.log("data-- in else if=", data);
  //   let res = await sendMailToAll(admin, data);
  //   return { message: "success", data: res };
  // }
  return null
};
export default function Index() {

  const navigate= useNavigate()

  useEffect(()=>{
    navigate('/app/plans')
  }, [])
  
  return (
    <></>
   
  );
}






