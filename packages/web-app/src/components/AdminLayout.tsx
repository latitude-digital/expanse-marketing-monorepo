import { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react';
import { useLocation, useNavigate, Outlet, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
// Import FontAwesome SVG icons as URLs
import Bars3IconUrl from '@fontawesome/regular/bars.svg';
import CalendarDaysIconUrl from '@fontawesome/regular/calendar-days.svg';
import TagsIconUrl from '@fontawesome/regular/tags.svg';
import UsersIconUrl from '@fontawesome/regular/users.svg';
import XMarkIconUrl from '@fontawesome/regular/xmark.svg';
import ArrowUpLeftFromCircleIconUrl from '@fontawesome/regular/arrow-up-left-from-circle.svg';
import CloudArrowUpIconUrl from '@fontawesome/regular/cloud-arrow-up.svg';
import { FontAwesomeIcon } from './FontAwesomeIcon';

// Create icon components for navigation
const CalendarDaysIcon = (props: any) => <FontAwesomeIcon src={CalendarDaysIconUrl} {...props} />;
const TagsIcon = (props: any) => <FontAwesomeIcon src={TagsIconUrl} {...props} />;
const UsersIcon = (props: any) => <FontAwesomeIcon src={UsersIconUrl} {...props} />;
const CloudArrowUpIcon = (props: any) => <FontAwesomeIcon src={CloudArrowUpIconUrl} {...props} />;
const Bars3Icon = (props: any) => <FontAwesomeIcon src={Bars3IconUrl} {...props} />;
const XMarkIcon = (props: any) => <FontAwesomeIcon src={XMarkIconUrl} {...props} />;
const ArrowUpLeftFromCircleIcon = (props: any) => <FontAwesomeIcon src={ArrowUpLeftFromCircleIconUrl} {...props} />;
import auth from '../services/auth';
import MeridianLogo from '../assets/meridian-square.svg';

const navigation = [
  { name: 'Events', href: '/admin', icon: CalendarDaysIcon },
  { name: 'Tags', href: '/admin/tags', icon: TagsIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Reupload', href: '/admin/reupload', icon: CloudArrowUpIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = not checked yet
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're on the survey edit page
  const isSurveyEditPage = location.pathname.includes('/admin/survey/');

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!loading) { // Only check when auth state is determined
        if (user) {
          try {
            const token = await user.getIdTokenResult(true); // Force refresh to get latest claims
            console.log('AdminLayout: Token claims:', token.claims);
            console.log('AdminLayout: Is admin?', token.claims.admin === true);
            setIsAdmin(token.claims.admin === true);
          } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          }
        } else {
          console.log('AdminLayout: No user found');
          setIsAdmin(false);
        }
      }
    };

    checkAdminStatus();
  }, [user, loading]);

  const handleNavigation = (href: string) => {
    navigate(href);
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await auth.signOut();
    navigate('/');
  };

  const currentPath = location.pathname;

  // Show loading while checking auth
  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin (only after checking is complete)
  if (!user || !isAdmin) {
    console.log('AdminLayout: Redirecting - user:', !!user, 'isAdmin:', isAdmin);
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?r=${returnUrl}`} replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon aria-hidden="true" className="h-6 w-6 text-gray-600" />
                </button>
              </div>
            </TransitionChild>

            {/* Mobile Sidebar */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 px-6 pb-2 border-r border-gray-200">
              <div className="flex h-16 shrink-0 items-center gap-3">
                <img
                  alt="Meridian"
                  src={MeridianLogo}
                  className="h-8 w-8"
                />
                <span className="text-gray-900 font-bold text-lg">Meridian Admin</span>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <button
                            onClick={() => handleNavigation(item.href)}
                            className={classNames(
                              currentPath === item.href
                                ? 'bg-gray-200 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                              'group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                            )}
                          >
                            <item.icon
                              aria-hidden="true"
                              className={classNames(
                                currentPath === item.href ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700',
                                'h-6 w-6 shrink-0'
                              )}
                            />
                            {item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                  <li className="-mx-6 mt-auto border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-700">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                      <span className="sr-only">Your profile</span>
                      <span aria-hidden="true" className="truncate">{user?.email}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                      Sign out
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Desktop Sidebar - Always narrow on survey edit page, otherwise narrow below lg, full width lg+ */}
      <div className={classNames(
        "hidden sm:fixed sm:inset-y-0 sm:z-50 sm:flex sm:flex-col",
        isSurveyEditPage ? "sm:w-16" : "sm:w-16 lg:w-72"
      )}>
        <div className={classNames(
          "flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 border-r border-gray-200",
          isSurveyEditPage ? "px-0" : "sm:px-2 lg:px-6"
        )}>
          <div className={classNames(
            "flex h-16 shrink-0 items-center gap-3",
            isSurveyEditPage ? "sm:justify-center" : "sm:justify-center lg:justify-start"
          )}>
            <img
              alt="Meridian"
              src={MeridianLogo}
              className={isSurveyEditPage ? "sm:h-8 sm:w-8" : "sm:h-8 sm:w-8 lg:h-10 lg:w-10"}
            />
            <span className={classNames(
              "text-gray-900 font-bold text-xl",
              isSurveyEditPage ? "hidden" : "hidden lg:block"
            )}>Meridian Admin</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className={classNames(
                  "space-y-1",
                  isSurveyEditPage ? "" : "sm:-mx-1 lg:-mx-2"
                )}>
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={() => handleNavigation(item.href)}
                        className={classNames(
                          currentPath === item.href
                            ? 'bg-gray-200 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                          'group flex w-full gap-x-3 rounded-md text-sm font-semibold leading-6',
                          isSurveyEditPage ? 'p-3 justify-center' : 'sm:p-2 lg:p-2 sm:justify-center lg:justify-start'
                        )}
                        title={item.name}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={classNames(
                            currentPath === item.href ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700',
                            'h-6 w-6 shrink-0'
                          )}
                        />
                        <span className={isSurveyEditPage ? "hidden" : "hidden lg:block"}>{item.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
              <li className={classNames(
                "mt-auto border-t border-gray-200 pt-4",
                isSurveyEditPage ? "" : "sm:-mx-2 lg:-mx-6"
              )}>
                <div className={classNames(
                  "items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-700",
                  isSurveyEditPage ? "hidden" : "hidden lg:flex"
                )}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="sr-only">Your profile</span>
                  <span aria-hidden="true" className="truncate">{user?.email}</span>
                </div>
                <div className="sm:hidden xl:hidden"></div>
                <button
                  onClick={handleSignOut}
                  className={classNames(
                    'flex w-full items-center gap-x-4 text-sm font-semibold leading-6 text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    isSurveyEditPage ? 'justify-center p-3' : 'sm:justify-center sm:p-3 lg:justify-start lg:px-6 lg:py-3'
                  )}
                  title="Sign out"
                >
                  <ArrowUpLeftFromCircleIcon className="h-6 w-6" />
                  <span className={isSurveyEditPage ? "hidden" : "hidden lg:block"}>Sign out</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-gray-50 border-b border-gray-200 px-4 py-4 shadow-sm sm:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="-m-2.5 p-2.5 text-gray-500 hover:text-gray-700 lg:hidden"
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon aria-hidden="true" className="h-6 w-6" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">Admin</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>

      {/* Main Content */}
      <main className={classNames(
        "min-h-screen flex flex-col",
        isSurveyEditPage ? "sm:pl-16" : "sm:pl-16 lg:pl-72"
      )}>
        <div className="flex-1 flex flex-col px-4 py-10 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}