import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import enTranslations from '@shopify/polaris/locales/en.json';
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];


export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={enTranslations}>
        <ui-nav-menu>
          <Link to="/app" rel="home" prefetch="viewport">Subscription</Link>
          <Link to="/app/plans" prefetch="viewport">Plans</Link>
          <Link to="/app/contracts" prefetch="viewport">Memberships</Link>
          <Link to="/app/emailCustomizer" prefetch="viewport">Email Customizer</Link>
        </ui-nav-menu>
       <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
