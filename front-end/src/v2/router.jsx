import { createBrowserRouter, RouterProvider } from "react-router-dom";
import StoreLayout from "./layouts/StoreLayout";
import { Home,Products,Detail,Content,Lookbooks,Vouchers,Cart,Checkout } from "./pages/StorePages";
import { Auth,RequireAuth,Account,Admin,AdminLayout,NotFound } from "./pages/SystemPages";
const content=["policy","privacy","terms","shipping","returns-refunds","payment-policy","cookies","contact-legal","faq","guide","about","blog","payment-result","payment/:orderId","order-lookup"];
const account=["my-coupons","profile","profile/data-requests","user/dashboard","orders","reviews/create"];
const admin=["","categories","products","orders","chats","customers","coupons","campaigns","banners","lookbooks","ab-testing","user-activity","pages","settings"];
const router=createBrowserRouter([{element:<StoreLayout/>,children:[{index:true,element:<Home/>},{path:"products",element:<Products/>},{path:"product/:slug",element:<Detail/>},{path:"lookbooks",element:<Lookbooks/>},{path:"vouchers",element:<Vouchers/>},{path:"favorites",element:<Products/>},{path:"cart",element:<Cart/>},{path:"checkout",element:<Checkout/>},...content.map(path=>({path,element:<Content/>})),...account.map(path=>({path,element:<RequireAuth><Account/></RequireAuth>}))]},{path:"/login",element:<Auth/>},{path:"/register",element:<Auth/>},{path:"/verify-otp",element:<Auth/>},{path:"/reset-password",element:<Auth/>},{path:"/admin",element:<RequireAuth admin><AdminLayout/></RequireAuth>,children:admin.map(path=>({index:path==="",path:path||undefined,element:<Admin/>}))},{path:"*",element:<NotFound/>}]);
export default function V2Router(){return <RouterProvider router={router}/>}
