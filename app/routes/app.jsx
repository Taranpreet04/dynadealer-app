import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
// import enTranslations from '@shopify/polaris/locales/en.json';
import knobStyle from '../components/knob.css?url';

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: knobStyle }
];


export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
        <ui-nav-menu>
          <Link to="/app" rel="home" prefetch="viewport">Subscription</Link>
          <Link to="/app/plans" prefetch="viewport">Raffles</Link>
          <Link to="/app/memberships" prefetch="viewport">Memberships</Link>
          <Link to="/app/contracts" prefetch="viewport">Subscribers</Link>
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
