export enum VercelAnalyticsEvents {
  ClickedCart = "ClickedCart",
  ClickedSearch = "ClickedSearch",
  ClickedCopyDownload = "ClickedCopyDownload",
  ClickedLinkDownload = "ClickedLinkDownload",
  // divide ClickedLinkBrewfile by 4 to better compare with ClickedLinkDownload
  // (because people do 4 more clicks on average to copy via selection)
  ClickedLinkBrewfile = "ClickedLinkBrewfile",
  ClickedCopyShare = "ClickedCopyShare",
  // divide ClickedLinkShare by 4 to better compare with ClickedCopyShare
  // (because people do 4 more clicks on average to copy via selection)
  ClickedLinkShare = "ClickedLinkShare",
}
