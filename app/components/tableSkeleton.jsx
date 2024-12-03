import { SkeletonPage, Card, DataTable, SkeletonBodyText, SkeletonDisplayText } from "@shopify/polaris";

export default function TableSkeleton(){
    return(
        <SkeletonPage primaryAction>
         <Card>
           <DataTable
             columnContentTypes={['text', 'text', 'text', 'text']}
             headings={[ <SkeletonBodyText lines={1} />,  <SkeletonBodyText lines={1} />, <SkeletonBodyText lines={1} />, <SkeletonBodyText lines={1} />]}
             rows={[
               [
                 <SkeletonDisplayText size="small" />,
                 <SkeletonDisplayText size="small" />,
                 <SkeletonDisplayText size="small" />,
                 <SkeletonDisplayText size="small" />,
               ],
               [
                 <SkeletonDisplayText size="small" />,
                 <SkeletonDisplayText size="small" />,
                 <SkeletonDisplayText size="small" />,
                 <SkeletonDisplayText size="small" />,
               ],
               [
                 <SkeletonDisplayText size="small" />,
                 <SkeletonDisplayText size="small" />,
                 <SkeletonDisplayText size="small" />,
                 <SkeletonDisplayText size="small" />,
               ],
             ]}
           />
         </Card>
       </SkeletonPage>
    )
}