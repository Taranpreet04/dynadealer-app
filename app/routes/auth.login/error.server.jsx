import { LoginErrorType } from "@shopify/shopify-app-remix/server";

export function loginErrorMessage(loginErrors) {
  console.log("loginErrors===",loginErrors)
  console.log("LoginErrorType===",LoginErrorType)
  if (loginErrors?.shop === LoginErrorType.MissingShop) {
    return { shop: "Please enter your shop domain to log in" };
  } else if (loginErrors?.shop === LoginErrorType.InvalidShop) {
    return { shop: "Please enter a valid shop domain to log in" };
  }
  // else if(loginErrors?.shop === 'virendertesting.myshopify.com'){
  //   return { shop: "Sorry, It is an custom app. " };
  // }
  return {};
}
