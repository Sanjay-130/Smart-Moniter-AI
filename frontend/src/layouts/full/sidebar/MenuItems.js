import {
  IconAperture,
  IconCopy,
  IconLayoutDashboard,
  IconLogin,
  IconMoodHappy,
  IconTypography,
  IconUserPlus,
  IconSettings,
  IconClipboardList,
  IconUserCheck,
  IconShieldCheck,
} from '@tabler/icons-react';

import { uniqueId } from 'lodash';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Home',
  },

  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
  },
  {
    navlabel: true,
    subheader: 'Student',
  },
  {
    id: uniqueId(),
    title: 'Exams',
    icon: IconTypography,
    href: '/exam',
  },
  {
    id: uniqueId(),
    title: 'My Results',
    icon: IconCopy,
    href: '/my-results',
    role: 'student', // Only show this to students
  },
  {
    id: uniqueId(),
    title: 'My Tasks',
    icon: IconClipboardList,
    href: '/my-tasks',
  },
  {
    id: uniqueId(),
    title: 'System Check',
    icon: IconShieldCheck,
    href: '/system-check',
    role: 'student',
  },
  {
    navlabel: true,
    subheader: 'Teacher',
  },
  {
    id: uniqueId(),
    title: 'Create Exam',
    icon: IconMoodHappy,
    href: '/create-exam',
  },
  {
    id: uniqueId(),
    title: 'Add Questions',
    icon: IconLogin,
    href: '/add-questions',
  },
  {
    id: uniqueId(),
    title: 'Manage Exams',
    icon: IconSettings,
    href: '/manage-exams',
  },
  {
    id: uniqueId(),
    title: 'Assign Exam',
    icon: IconUserCheck,
    href: '/assign-exam',
  },
  {
    id: uniqueId(),
    title: 'Exam Logs',
    icon: IconUserPlus,
    href: '/exam-log',
  },
  {
    id: uniqueId(),
    title: 'Block Student',
    icon: IconUserCheck,
    href: '/block-student',
  },
];

export default Menuitems;
