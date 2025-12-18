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

function useDyslexiaToggle() {
  const [isDyslexia, setIsDyslexia] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('dyslexia-mode');
    return saved === 'true';
  });

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dyslexia-friendly', isDyslexia);
    localStorage.setItem('dyslexia-mode', isDyslexia ? 'true' : 'false');
  }, [isDyslexia]);

  return { isDyslexia, toggle: () => setIsDyslexia((prev) => !prev) };
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
  const { isDyslexia, toggle: toggleDyslexia } = useDyslexiaToggle();

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
            <div className="px-2 pr-4 mt-4">
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

            {/* DISLEXIA TOGGLE */}
            <button
              onClick={toggleDyslexia}
              className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-700 transition hover:bg-purple-600/20 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-purple-600/20 dark:text-slate-100"
              aria-pressed={isDyslexia}
              title={isDyslexia ? "Desactivar modo dislexia" : "Activar modo dislexia"}
            >
              <svg 
                className={isDyslexia ? "h-6 w-6 text-purple-600 dark:text-purple-400" : "h-6 w-6 text-slate-600 dark:text-slate-300"} 
                fill="currentColor" 
                viewBox="60 10 1040 1040"
              >
<path d="M848.7 134.4a290 290 0 0 1 32 32.8l6.5 7.6c54.8 62.4 85 147 89.8 229.2l.2 3.2A388 388 0 0 1 931 613a329 329 0 0 1-44.6 66.1c-15.5 18.6-15.5 18.6-21.2 23.4-3.3 3-5.6 5.1-6 9.7v92.1l.1 102.2c.2 20.9-1.7 39.5-17 55.3L840 964l-2.2 2.2c-14 13.4-33.5 15.7-51.8 19l-18.5 3.2L753 991l-28.4 5-53.2 9.4-108.3 19.3-22.2 4-3.1.5-98.6 17.8c-18.4 3.4-35.2 3.8-51.2-6.9-7-5-11.4-10.2-15.4-17.8l-1-2c-5.4-11.2-4.9-23.7-4.8-35.9v-18l.1-13.3.1-26.1-2.7.4-55.8 8.6c-27.6 4.2-56-.1-79-16.9L222 913l-2.2-1.8A102 102 0 0 1 188 861l-.8-2.7c-3.1-13.3-2.6-26.7-2.5-40.2V810l.1-40.6.2-44.4h-8l-2.2.1a79 79 0 0 1-54.5-21.2A67 67 0 0 1 102 655c1.5-27 17.3-51.2 29.7-74.6l7.2-13.6 1.5-3L170 507l1.6-3 3.1-6 1.4-2.8 1.3-2.4c1.5-2.8 1.5-2.8 2.8-4.5 5.2-7.7 4.4-16.4 4.3-25.4v-47.1q.2-22.6 3.4-44.8l.3-2.2q.8-6 2-11.7l.6-3.5q9.5-49.8 31.1-95.6l1.2-2.6A360 360 0 0 1 258 197l1.2-1.6a341 341 0 0 1 23.7-29l5.7-6.6q5-5.6 10.4-10.8l7.7-7.8a185 185 0 0 1 24-21.3 381 381 0 0 1 83-51.8A384 384 0 0 1 539 33l2.8-.4c99.1-12.8 204.5 20 307 101.8M531 92l-3 .4a323 323 0 0 0-19 3.6l-2.8.6a343 343 0 0 0-168.3 94.3l-2.6 2.6A195 195 0 0 0 319 212l-4.2 5a283 283 0 0 0-29 43.2 316 316 0 0 0-28.7 65.5 358 358 0 0 0-9.4 36l-.7 3.2c-5.8 29.5-5.4 59.3-5.4 89.2v25.3c0 9-.6 16.4-4.6 24.6l-1.1 2.4a174 174 0 0 1-6 11.3l-1.5 2.6-5.8 11.1q-6.4 12.5-13.1 24.6-9.2 17-17.8 34-7.4 14.8-15.3 29.2-5.7 10.3-11 21l-1.4 2.5-1.1 2.3-1 2a24 24 0 0 0-1.9 13c2 3.3 3.7 4.7 7.4 5.6 11.5 1.9 23 1.8 34.7 1.8h10.8c7.5.2 13.1 2.7 19.3 6.7a34 34 0 0 1 9 25v43.2l.2 85.9A51 51 0 0 0 252 861l1.3 1.9A46 46 0 0 0 281 879c10.2.8 20.2-1 30.2-2.6l31.9-5 28.2-4.3c29.9-4.6 29.9-4.6 43.5 3.6 8.1 8.5 9.5 19 9.5 30.3l.3 36 .1 17.6.3 34.4q11.6-.9 23-3l3.6-.6 9.6-1.7 10.5-1.9 87.5-15.4 41.3-7.3 2.6-.5 75.6-13.3 2.3-.4 92.2-16.3 12.3-2.1 3.7-.6 3.4-.7 3-.5c2.7-.8 3.8-1.4 5.4-3.7q.4-4.5.4-9v-91.3l-.1-29.2v-82.2c-.2-13.8.3-24 9.6-34.8l4.5-4.4 5-4.9 6.7-6.4 1.6-1.5q6-6 11.3-12.3l1.5-1.7a342 342 0 0 0 76.9-248.5A338 338 0 0 0 842 211l-2.4-3a322 322 0 0 0-20.7-22.3l-2.7-2.8A234 234 0 0 0 797 166l-5.5-4.7A272 272 0 0 0 753 135l-2.3-1.3A335 335 0 0 0 617 90l-2.8-.3a351 351 0 0 0-34.1-1q-24.7-.1-49.1 3.3"/>
<path d="M544.3 244.7h10.8l27.4-.2h10.1c2.4.5 2.4.5 4.1 2.2q2 3.6 3 7.5l1 3.2 1 3.3 1.1 3.5 8.7 28.9 1 3 .8 2.8c.5 2 .5 2 1.7 3.1l5 .1h32l92-.1 3.8-12 1.1-3.4q3-9 5.7-18.3l1.2-3.7 2.1-7.2 1.1-3.6 1-3.2c1-2.7 1.7-3.8 4-5.6 2.5-.4 2.5-.4 5.4-.4h48.3l2.3.4c2.2 3.2 2.2 4.1 1.5 7.8q-1.9 7.4-4.4 14.7l-28.1 87-1 3.1-24.6 76.5c-10.6 33-10.6 33-21 66.2L732.2 532l-.6 1.9-.7 2-9 28.8-2.2 7-.7 2a20 20 0 0 1-7 10.3c-3 .6-3 .6-6.5.6h-21.4l-24.8-.1-9.4-.1c-3.3-.5-4.6-1-6.9-3.4l-2-4.9-1-3-1-3.3-4.1-12.9-3.2-10-6.5-20.2-5.2-16.2-5.7-17.7-23.5-72.9-.7-2.3-15.3-47.2-1.2-3.7-15.4-47.7-.6-2-4.6-14.2-1.2-3.7-1.2-3.7-11.2-34.4c-3-9.3-3-9.3-2.4-14 2.6-2.6 3.7-2.3 7.3-2.3M629 348q1.6 9 4.3 17.8l.6 2.1 2.2 7 5 15.8 7.9 25.5 14.4 46.6.7 2.5 11.2 37.1 1 3.4 1 3c.6 2.2.6 2.2 1.7 4.2h2l46.6-152.7.8-2.4a33 33 0 0 0 1.6-9.9zm-101 37c21.4 19 31.9 43.7 33.8 71.8 1.4 28.9-6.1 57.4-25.8 79.2a277 277 0 0 1-36.3 31.1 264 264 0 0 0-25.1 21l-1.5 1.5a41 41 0 0 0-9.8 15.6l-.7 2-.6 1.8-.5 1.6q-.9 5.2-.7 10.6l-.2 19.8v2.3c-.1 5.2-.1 5.2-2.3 7.4a12 12 0 0 1-7.3 1.7h-3l-30.8.1H414c-7.2 0-7.2 0-10.7-2a21 21 0 0 1-1.8-10.8v-15.5c0-25 5.7-44.8 23.5-63.2l5.7-5 6.5-6q8-7.4 16.9-13.8 11.2-8.5 21.6-18 3-3 6.4-5.6a59 59 0 0 0 20.6-41.2A56 56 0 0 0 491 430a61 61 0 0 0-42-20.2c-19.7-.7-38 2.3-53.5 15.5a56 56 0 0 0-16.6 39.7v3.5l-.2 10.5v3.2c-.7 3.5-1.7 4.6-4.6 6.7-2.6.4-2.6.4-5.6.2l-3.3-.2-3.6-.2-3.6-.2-17-.8-5.3-.2-2.4-.1c-9.1-.4-9.1-.4-12.2-3.5-2.1-32.6 3-63.2 24.9-88.6l2.1-2.4 1.6-1.8c43-46.5 132-45.9 178.4-6.2m-75.8 318.9a38 38 0 0 1 15.4 26.3c1 11.5-1.3 22.2-8.7 31.2a38 38 0 0 1-26.8 12A41 41 0 0 1 403 764a39 39 0 0 1-11.5-28.8c0-11.2 3.3-20 11.1-28.2 14.4-12 33.8-12 49.6-3.2"/>
              </svg>
            </button>

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
