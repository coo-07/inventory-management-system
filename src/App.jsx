import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import Header from "./components/Header";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import RoleSelect from "./pages/RoleSelect";
import AdminLogin from "./pages/AdminLogin";
import StaffLogin from "./pages/StaffLogin";
import Tanaoroshi from "./pages/Tanaoroshi";
import Home from "./pages/Home";
import ItemForm from "./pages/ItemForm";
import ItemImport from "./pages/ItemImport";
import ItemDetail from "./pages/ItemDetail";
import CategorySettings from "./pages/CategorySettings";
import StockRecord from "./pages/StockRecord";
import TanaoroshiResults from "./pages/TanaoroshiResults";
import Shop from "./pages/Shop";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <Header />
          <Routes>
            <Route path="/" element={<RoleSelect />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route path="/tanaoroshi" element={<Tanaoroshi />} />
            <Route
              path="/items"
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />
            <Route
              path="/items/new"
              element={
                <RequireAuth>
                  <ItemForm />
                </RequireAuth>
              }
            />
            <Route
              path="/items/import"
              element={
                <RequireAuth>
                  <ItemImport />
                </RequireAuth>
              }
            />
            <Route
              path="/settings/categories"
              element={
                <RequireAuth>
                  <CategorySettings />
                </RequireAuth>
              }
            />
            <Route
              path="/items/tanaoroshi-results"
              element={
                <RequireAuth>
                  <TanaoroshiResults />
                </RequireAuth>
              }
            />
            <Route
              path="/items/:id"
              element={
                <RequireAuth>
                  <ItemDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/items/:id/edit"
              element={
                <RequireAuth>
                  <ItemForm />
                </RequireAuth>
              }
            />
            <Route
              path="/items/:id/record"
              element={
                <RequireAuth>
                  <StockRecord />
                </RequireAuth>
              }
            />
            <Route
              path="/shop"
              element={
                <RequireAuth>
                  <RequireAdmin>
                    <Shop />
                  </RequireAdmin>
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
