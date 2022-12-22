export enum CardContentDirection {
    Vertical = "Vertical",
    Horizontal = "Horizontal",
}

export enum CardLinkIconPlacement {
    BeforeLink = "BeforeLink",
    AfterLink = "AfterLink",
    AfterLinkApart = "AfterLinkApart",
    BeforeLinkApart = "BeforeLinkApart",
}

export interface ContentCardProps {
    redirectTo: string
    isExternalRedirect?: boolean
    direction?: CardContentDirection
    onClick?: (e) => void
    imgSrc: string
    title: string
    linkText: string
    LinkIcon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
    linkIconClass?: string
    linkIconPlacement?: CardLinkIconPlacement
}
