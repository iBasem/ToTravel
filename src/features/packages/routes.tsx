import { Route, Routes } from "react-router-dom";
import PackagesList from "./pages/PackagesList";
import PackageDetails from "./pages/PackageDetails";

export const PackagesRoutes = () => {
    return (
        <Routes>
            <Route index element={<PackagesList />} />
            <Route path=":id" element={<PackageDetails />} />
        </Routes>
    );
};
