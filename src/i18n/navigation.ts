import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

/**
 * أغلفة التنقل الواعية باللغة.
 * استخدم هذه دائماً بدل next/navigation مباشرةً حتى تُحترم بادئة اللغة.
 */
export const {Link, redirect, usePathname, useRouter, getPathname} = createNavigation(routing);
