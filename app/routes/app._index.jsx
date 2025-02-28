import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import TableSkeleton from "../components/tableSkeleton";
// import { useNavigate } from "@remix-run/react";
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
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import { DeleteIcon } from "@shopify/polaris-icons";

import React from "react";
import {
  updateRaffleProducts,
  getRaffleProducts,
} from "../controllers/planController";
import { Knob } from "../components/knob";
import { sendMailToAll } from "../db.mailcontroller";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  let data = await getRaffleProducts(admin);
  return { data: data?.data };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.formData();
  let products = JSON.parse(body.get("products"));
  let data = JSON.parse(body.get("data"));
  if (products) {
    let res = await updateRaffleProducts(admin, products);
    return { message: "success", data: res };
  } else if (data) {
    console.log("data-- in else if=", data);
    let res = await sendMailToAll(admin, data);
    return { message: "success", data: res };
  }
};
export default function Index() {
  const [products, setProducts] = useState([]);
  const [productIds, setProductIds] = useState([]);
  const [dltBtnLoader, setDltBtnLoader] = useState(false);
  const [statusChangeId, setStatusChangeId] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [tableSkel, setTableSkel] = useState(false);
  const [reCheck, setReCheck] = useState(false);
  const [notifyId, setNotifyId] = useState("");

  const submit = useSubmit();
  const loaderData = useLoaderData();
  const actionData = useActionData();

  useEffect(() => {
    console.log("loader again");
    if (loaderData) {
      setTableSkel(false);
      loaderData?.data?.products ? setProducts(loaderData?.data?.products) : "";
      setStatusChangeId("");
      setNotifyId("");
    }
  }, [loaderData]);

  useEffect(() => {
    if (actionData?.message === "success") {
      setTableSkel(true);
      setDltBtnLoader(false);
      console.log(statusChangeId, deleteId, notifyId);
      statusChangeId
        ? shopify.toast.show("Status update successfully.", { duration: 5000 })
        : deleteId
          ? shopify.toast.show("Product deleted successfully.", {
              duration: 5000,
            })
          : notifyId
            ? shopify.toast.show("Mail sent to all successfully.", {
                duration: 5000,
              })
            : shopify.toast.show("Add raffle products successfully", {
                duration: 5000,
              });
    }
  }, [actionData]);

  useEffect(() => {
    if (products?.length > 0) {
      let selectedIds = [];
      products?.map((item) => {
        selectedIds.push({ id: item?.id });
      });
      setProductIds(selectedIds);
    }
  }, [products]);

  const handleResourcePicker = async () => {
    const productPickerData = await shopify.resourcePicker({
      type: "product",
      filter: {
        draft: false,
        variants: false,
      },
      selectionIds: productIds,
      multiple: true,
    });
    let sendData = [];
    if (productPickerData !== undefined) {
      productPickerData?.map((item) => {
        let existProduct = products?.filter((itm) => itm?.id == item?.id);
        console.log("existProduct=", existProduct);
        existProduct?.length > 0
          ? sendData.push(existProduct[0])
          : sendData.push({
              id: item.id,
              title: item.title,
              totalInventory: item.totalInventory,
              status: true,
            });
      });
      console.log("existProduct=", sendData);
      let formData = {
        products: JSON.stringify(sendData)
      }
      submit(formData, {
        method: 'POST'
      })
    }
  };

  const handleChange = (id) => {
    setStatusChangeId(id);
    let updatedProducts = [];
    products.map((itm) =>
      updatedProducts.push(
        itm.id === id ? { ...itm, status: !itm.status } : itm,
      ),
    );
    let formData = { products: JSON.stringify(updatedProducts) };
    submit(formData, { method: "POST" });
  };

  const rows = products?.map((item, index) => [
    <Text> {item?.title} </Text>,
    <Text> {item?.totalInventory} </Text>,
    <>
      {" "}
      {statusChangeId == item?.id ? (
        <Spinner accessibilityLabel="Small spinner example" size="small" />
      ) : (
        <Knob
          selected={item?.status}
          ariaLabel="Example knob"
          onClick={() => handleChange(item?.id)}
        />
      )}
    </>,
    <InlineStack as="span" align="end" gap={300}>
      <Button
        variant="primary"
        loading={item?.id == notifyId ? true : false}
        disabled={!item?.status}
        onClick={() => {
          setNotifyId(item?.id);
          let formData = {
            data: JSON.stringify(item),
          };
          submit(formData, {
            method: "POST",
          });
        }}
      >
        Notify all
      </Button>

      <span
        onClick={() => {
          setReCheck(true);
          setDeleteId(item?.id);
        }}
      >
        {deleteId == item?.id && dltBtnLoader ? (
          <Spinner accessibilityLabel="Small spinner example" size="small" />
        ) : (
          <Icon source={DeleteIcon} alignment="end" />
        )}
      </span>
    </InlineStack>,
  ]);

  const handleDelete = () => {
    setDltBtnLoader(true);
    let filteredProducts = [];
    if (deleteId) {
      filteredProducts = products?.filter(
        (product) => deleteId !== product?.id,
      );
      let formData = {
        products: JSON.stringify(filteredProducts),
      };
      submit(formData, {
        method: "POST",
      });
    }
  };
  return (
    <>
      {tableSkel ? (
        <TableSkeleton />
      ) : (
        <Page
          title="Raffle Products"
          primaryAction={
            <Button variant="primary" onClick={() => handleResourcePicker()}>
              Select products
            </Button>
          }
        >
          {products?.length > 0 ? (
            <Box paddingBlockStart={300}>
              <DataTable
                hasZebraStripingOnData
                hoverable
                stickyHeader
                columnContentTypes={["text", "text", "text", "text"]}
                headings={[
                  <Text variant="headingSm" as="h6">
                    Product Name
                  </Text>,
                  <Text variant="headingSm" as="h6">
                    {" "}
                    Total Inventory
                  </Text>,
                  <Text variant="headingSm" as="h6">
                    {" "}
                    Status
                  </Text>,
                  <Text variant="headingSm" alignment="end" as="h6">
                    {" "}
                    Action
                  </Text>,
                ]}
                rows={rows}
                verticalAlign="middle"
              />
            </Box>
          ) : (
            <Card>
              <EmptyState
                heading="Let's create your first subscription plan."
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              ></EmptyState>
            </Card>
          )}
          <div className="sd-ultimate-option-AlertModal">
            <Modal
              open={reCheck}
              onClose={() => setReCheck(false)}
              title={"Delete Product ?"}
              primaryAction={{
                content: "Delete",
                onAction: () => {
                  setReCheck(false);
                  // setDltBtnLoader(true)
                  handleDelete();
                },
              }}
              secondaryActions={[
                {
                  content: "Cancel",
                  onAction: () => {
                    setReCheck(false);
                  },
                },
              ]}
            >
              <Modal.Section>
                <BlockStack gap={5}>
                  <p>
                    Are you sure you want to delete this product from list? This
                    can't be restored.
                  </p>
                </BlockStack>
              </Modal.Section>
            </Modal>
          </div>{" "}
        </Page>
      )}
    </>
  );
}
