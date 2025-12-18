import {
  useEffect,
  useMemo,
  useState,
  useLayoutEffect,
  ReactNode,
} from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useApp } from "../store/appStore";
import { useConfirm } from "../components/Confirm";
import { FiCrosshair, FiList, FiX } from "react-icons/fi";
import { IconType } from "react-icons";

type NavItem = {
  to: string;
  label: string;
  requireAdmin?: boolean;
};

const items: NavItem[] = [
  { to: "/avance", label: "Avance Curricular" },
  { to: "/plan", label: "Crear proyección" },
  { to: "/proyecciones", label: "Mis proyecciones" },
  { to: "/demanda", label: "Demanda" },
  { to: "/oferta", label: "Oferta", requireAdmin: true },
];

function useThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((prev) => !prev) };
}

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const confirm = useConfirm();
  const {
    rut,
    setRut,
    seleccion,
    setSeleccion,
    carreras,
    setCarreras,
    adminKey,
    setAdminKey,
  } = useApp();
  const { isDark, toggle } = useThemeToggle();

  const [toggleMenu, setToggleMenu] = useState(false);

  useEffect(() => {
    if (!rut) nav("/", { replace: true });
  }, [rut, nav]);

  const filteredNav = useMemo(() => {
    return items.filter((item) =>
      item.requireAdmin ? Boolean(adminKey) : true
    );
  }, [adminKey]);

  async function logout() {
    const ok = await confirm({
      title: "Cerrar sesión",
      description:
        "Se borrará la información almacenada localmente. ¿Deseas continuar?",
    });
    if (!ok) return;
    setRut("");
    setSeleccion(null);
    setCarreras([]);
    setAdminKey("");
    nav("/");
  }

  const selectedLabel =
    carreras.find(
      (c) =>
        seleccion &&
        c.codigo === seleccion.codCarrera &&
        c.catalogo === seleccion.catalogo
    )?.nombre ?? "";

  const menuToggleButton = (Icon: IconType): ReactNode => (
    <button
      onClick={() => {
        setToggleMenu((prev) => (prev = !prev));
      }}
      className="md:hidden "
    >
      <Icon size={24} />{" "}
    </button>
  );
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 transition-colors dark:bg-slate-900 dark:text-slate-100 ">
      {/* <aside className="sm:visible  md:invisible fixed inset-y-0 md:left-0 z-30 md:w-72 bg-teal-700
      dark:bg-teal-900 text-white transition-transform duration-200 overflow-hidden">
        <button> asd</button>

      </aside> */}
      {toggleMenu && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setToggleMenu(false)}
        />
      )}

      <aside
        onClick={(e) => e.stopPropagation()}
        className={[
          "fixed inset-y-0 left-0 w-72 bg-teal-700 dark:bg-teal-900 text-white",
          "transition-transform duration-200 overflow-hidden z-50",
          toggleMenu ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0", // always visible on md+
        ].join(" ")}
      >
      <div className="px-1 py-1 h-4">{menuToggleButton(FiX)}</div>

        {/* --- Header with RUT and Carrera --- */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4 z-10">
          <div className="h-9 w-9 rounded-full bg-white/20" />
          <div className="text-sm">
            <p className="font-semibold leading-none">
              {rut || "Sin identificación"}
            </p>
            <p className="opacity-80">
              {seleccion
                ? `${seleccion.codCarrera}-${seleccion.catalogo}`
                : "Selecciona carrera"}
            </p>
          </div>
        </div>

        {/* --- Content area below header --- */}
        <div className="relative flex flex-col h-[calc(100%-4rem)]">
          {" "}
          {/* 4rem = header height */}
          {/* Colored overlay */}
          <div className="absolute inset-0 bg-slate-900/30 pointer-events-none z-0" />
          {/* --- Nav + Footer container --- */}
          <div className="flex flex-col flex-1 justify-between relative z-10 overflow-hidden">
            {/* --- Nav items (scrollable if long) --- */}
            <nav className="thin-scroll flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {filteredNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "block rounded-md px-4 py-2 transition",
                      isActive
                        ? "bg-white/15 text-white shadow-sm"
                        : "hover:bg-white/10 text-white/80",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {!adminKey && (
                <Link
                  to="/admin"
                  className="block rounded-md px-4 py-2 text-sm text-white/70 underline underline-offset-4 hover:text-white"
                >
                  Ingresar clave admin
                </Link>
              )}
            </nav>

            {/* --- Logout button stays pinned to bottom --- */}
            <div className="border-t border-white/10 p-4">
              <button
                className="w-full rounded-xl bg-amber-600 py-3 font-semibold text-white shadow hover:bg-orange-600"
                onClick={logout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="md:ml-72 min-h-screen ">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white md:px-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-800">
          <div className="flex ">
            <div className="px-2 mt-4">
              {/* Toogle Mobile Menu */}
              {menuToggleButton(FiList)}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {selectedLabel || "Planificador UCN"}
              </p>

              <p className="font-semibold">
                {filteredNav.find((item) => item.to === pathname)?.label ??
                  "Panel"}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {seleccion && (
              <select
                value={`${seleccion.codCarrera}-${seleccion.catalogo}`}
                onChange={(e) => {
                  const [codCarrera, catalogo] = e.target.value.split("-");
                  setSeleccion({ codCarrera, catalogo });
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-700 dark:text-slate-100"
              >
                {carreras.map((c) => (
                  <option
                    key={`${c.codigo}-${c.catalogo}`}
                    value={`${c.codigo}-${c.catalogo}`}
                  >
                    {c.nombre} ({c.codigo}-{c.catalogo})
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={toggle}
              className="rounded-full border border-slate-200 bg-white p-1 text-slate-700 transition hover:bg-sky-600/20 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-sky-600/20 dark:text-slate-100"
              aria-pressed={isDark}
              title="Cambiar tema"
            >
              {isDark ? (
                <svg
                  className="h-7 w-7 text-amber-100"
                  viewBox="-1 -1 26 26"
                  fill="currentColor"
                >
                  <path d="M19.9001 2.30719C19.7392 1.8976 19.1616 1.8976 19.0007 2.30719L18.5703 3.40247C18.5212 3.52752 18.4226 3.62651 18.298 3.67583L17.2067 4.1078C16.7986 4.26934 16.7986 4.849 17.2067 5.01054L18.298 5.44252C18.4226 5.49184 18.5212 5.59082 18.5703 5.71587L19.0007 6.81115C19.1616 7.22074 19.7392 7.22074 19.9001 6.81116L20.3305 5.71587C20.3796 5.59082 20.4782 5.49184 20.6028 5.44252L21.6941 5.01054C22.1022 4.849 22.1022 4.26934 21.6941 4.1078L20.6028 3.67583C20.4782 3.62651 20.3796 3.52752 20.3305 3.40247L19.9001 2.30719Z" />
                  <path d="M16.0328 8.12967C15.8718 7.72009 15.2943 7.72009 15.1333 8.12967L14.9764 8.52902C14.9273 8.65407 14.8287 8.75305 14.7041 8.80237L14.3062 8.95987C13.8981 9.12141 13.8981 9.70107 14.3062 9.86261L14.7041 10.0201C14.8287 10.0694 14.9273 10.1684 14.9764 10.2935L15.1333 10.6928C15.2943 11.1024 15.8718 11.1024 16.0328 10.6928L16.1897 10.2935C16.2388 10.1684 16.3374 10.0694 16.462 10.0201L16.8599 9.86261C17.268 9.70107 17.268 9.12141 16.8599 8.95987L16.462 8.80237C16.3374 8.75305 16.2388 8.65407 16.1897 8.52902L16.0328 8.12967Z" />
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 11.5373 21.3065 11.4608 21.0672 11.8568C19.9289 13.7406 17.8615 15 15.5 15C11.9101 15 9 12.0899 9 8.5C9 6.13845 10.2594 4.07105 12.1432 2.93276C12.5392 2.69347 12.4627 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                </svg>
              ) : (
                <svg
                  className="h-7 w-7 text-yellow-500"
                  viewBox="2 3 27 27"
                  fill="currentColor"
                >
                  <path d="M8.031 16.5c0 4.143 3.358 7.5 7.5 7.5s7.5-3.357 7.5-7.5-3.357-7.5-7.5-7.5c-4.142 0-7.5 3.357-7.5 7.5zM15.531 3.75l-2.109 4.219h4.219l-2.11-4.219zM24.543 7.457l-4.475 1.491 2.982 2.983 1.493-4.474zM10.994 8.948l-4.474-1.491 1.491 4.475 2.983-2.984zM6.969 14.359l-4.219 2.11 4.219 2.109v-4.219zM24.031 18.641l4.219-2.109-4.219-2.109v4.218zM15.531 29.25l2.109-4.219h-4.219l2.11 4.219zM20.068 24.052l4.475 1.491-1.492-4.475-2.983 2.984zM6.52 25.543l4.475-1.491-2.983-2.983-1.492 4.474z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] bg-transparent p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
