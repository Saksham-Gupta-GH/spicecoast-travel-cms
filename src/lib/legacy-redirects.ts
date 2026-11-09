export const LEGACY_REDIRECTS = [
  { oldPath: "/kerala-packages/munnar-alleppey.html", newPath: "/packages/munnar-thekkady-alleppey-houseboat" },
  { oldPath: "/tours/south-india-pilgrim-madurai.php", newPath: "/packages/madurai-rameswaram-kanyakumari-pilgrim" },
  { oldPath: "/honeymoon-specials/wayanad-resort.asp", newPath: "/packages/wayanad-misty-hills-luxury-retreat" },
  { oldPath: "/luxury/kumarakom-marari-7days", newPath: "/packages/kerala-grand-heritage-backwaters-beach" },
  { oldPath: "/blog/houseboat-tips-kerala", newPath: "/blog/alleppey-houseboat-guide-first-timers" },
  { oldPath: "/munnar-tour", newPath: "/packages/munnar-thekkady-alleppey-houseboat" },
  { oldPath: "/kerala-enquiry", newPath: "/packages" },
  { oldPath: "/contact-us.html", newPath: "/#enquiry" },
] as const;

export const LEGACY_REDIRECT_MAP = new Map<string, string>(
  LEGACY_REDIRECTS.map(({ oldPath, newPath }) => [oldPath, newPath])
);
