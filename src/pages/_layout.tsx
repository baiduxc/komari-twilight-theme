import { LiveDataProvider } from "@/contexts/LiveDataContext";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import { Outlet, useLocation } from "react-router-dom";

const IndexLayout = () => {
  const location = useLocation();
  const isTwilightHome = location.pathname === "/";
  return <LiveDataProvider>{isTwilightHome ? <Outlet/> : <div className="layout flex min-h-screen w-full flex-col bg-accent-1"><main className="main-content m-1 h-full"><NavBar/><Outlet/></main><Footer/></div>}</LiveDataProvider>;
};
export default IndexLayout;
