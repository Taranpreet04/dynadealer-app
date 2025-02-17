import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
// import { useNavigate } from "@remix-run/react";
import {
  Button, Page, Card, EmptyState, IndexTable,
  Link, EmptySearchResult,
  useIndexResourceState,
  Text,
  useBreakpoints,
} from "@shopify/polaris";
import { useEffect, useState } from "react";

import React from 'react';
import { updateRaffleProducts, getRaffleProducts } from "../controllers/planController";
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  let data = await getRaffleProducts(admin)
  console.log("inloader==", data)
  return { data: data?.data }
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.formData();
  let products = JSON.parse(body.get("products"));
  console.log("boduu=body", products)
  let res = await updateRaffleProducts(admin, products)
  return { message: 'success', data: res };
};
export default function Index() {
  const [products, setProducts] = useState([])
  const [productIds, setProductIds] = useState([])
  const submit = useSubmit()
  const loaderData = useLoaderData()
  const actionData = useActionData()
  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products);

  console.log("selectedResources==", selectedResources)
  const rowMarkup = products.map(
    ({ id, name, status, title, totalInventory }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >

        <IndexTable.Cell>{title}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="center" numeric>
            {totalInventory}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" numeric>
            {status}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Link
            dataPrimaryLink
            url='#'
            onClick={() => console.log(`Clicked ${name}`)}
          >
            <Text fontWeight="bold" as="span" alignment="end">
              Send mail to all
            </Text>
          </Link>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );
  const emptyStateMarkup = (
    <EmptySearchResult
      title={'No products yet...!'}
      description={'Click on select products button and add them to see results.'}
      withIllustration
    />
  );

  useEffect(() => {
    console.log("loaderData==", loaderData)
    if (loaderData) {
      loaderData?.data?.products ?
        setProducts(loaderData?.data?.products) : ''
        handleSelectionChange("all", false);
    }
  }, [loaderData])
  
  useEffect(() => {
    if (actionData) {
    }
  }, [actionData])
  useEffect(() => {
    if (products?.length > 0) {
      let selectedIds = []
      products?.map((item) => {
        selectedIds.push({ id: item.id });
      });
      setProductIds(selectedIds)
    }
  }, [products])

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
    let sendData = []
    if (productPickerData !== undefined) {
      productPickerData?.map((item) => {

        sendData.push({
          id: item.id,
          title: item.title,
          totalInventory: item.totalInventory,
          status: item.status,
        });
      });
      console.log("sendData==", sendData)
      // setProducts(sendData)
      let formData = {
        products: JSON.stringify(sendData)
      }
      submit(formData, {
        method: 'POST'
      })
    }


  }

  const handleDelete = () => {
    console.log("products---", products)
    console.log("selected Resources---", selectedResources)
    let filteredProducts = []
    if (selectedResources) {
      filteredProducts = products.filter(product => !selectedResources.includes(product.id));
      console.log(filteredProducts);
      let formData = {
        products: JSON.stringify(filteredProducts)
      }
      submit(formData, {
        method: 'POST'
      })
    }
  }
  return (
    <Page title="Raffle Products" primaryAction={<Button
      variant="primary"
      onClick={() => handleResourcePicker()}>Select products</Button>}
      secondaryActions={<Button variant="primary" tone="critical" disabled={
        selectedResources?.length <= 0 ? true : false}
        onClick={handleDelete}>
        Delete
      </Button>}>
      <Card>
        <IndexTable
          condensed={useBreakpoints().smDown}
          resourceName={resourceName}
          itemCount={products.length}
          emptyState={emptyStateMarkup}
          selectedItemsCount={
            allResourcesSelected ? 'All' : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: 'Product Name' },
            { title: 'Total Inventory' },
            {
              id: 'status',
              title: (
                <Text as="span" alignment="end">
                  Status
                </Text>
              ),
            },
            {
              id: 'action',
              title: (
                <Text as="span" alignment="end">
                  Action
                </Text>
              ),
            },
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </Card>
    </Page>
  )
}
