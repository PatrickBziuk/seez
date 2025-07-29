import { getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'Books', href: getPermalink('/books') },
    { text: 'Projects', href: getPermalink('/projects') },
    { text: 'Lab', href: getPermalink('/lab') },
    { text: 'Life', href: getPermalink('/life') },
    { text: 'About', href: getPermalink('/about') }, // Added after Life
    { text: 'Contact', href: getPermalink('/contact') }, // Added after About
    // You can add submenus here if needed in the future
  ],
  actions: [],
  locale: 'en', // Default, will be overridden by prop
};

export const footerData = {
  links: [
    {
      title: 'lol',
      links: [
        { text: 'About', href: getPermalink('/about') },
        { text: 'Blog', href: getPermalink('/blog') },
      ],
    },
  ],
  secondaryLinks: [],
  socialLinks: [],
  footNote: '',
  locale: 'en', // Default, will be overridden by prop
};
