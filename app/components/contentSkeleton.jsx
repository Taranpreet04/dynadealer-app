import { SkeletonPage, Card, SkeletonBodyText, SkeletonDisplayText, BlockStack } from "@shopify/polaris";

export default function ContentSkeleton() {
    return (
        <SkeletonPage primaryAction>
            <Card sectioned>
                <SkeletonBodyText />
            </Card>
            <Card sectioned>
                <BlockStack >
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText />
                </BlockStack >
            </Card>
            <Card sectioned>
                <BlockStack >
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText />
                </BlockStack >
            </Card>
        </SkeletonPage>
    )
}