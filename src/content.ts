function getAuthUser (anchor: HTMLAnchorElement): string {
  const userHref = new URL(anchor.href).searchParams.get("authuser");
  if (userHref !== null) {
      return userHref;
  }

  const userUrl = location.pathname.match(/^\/u\/(\d+)\//);
  return userUrl?.[1] ?? "0";
}