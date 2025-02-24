import 'react';

declare module 'react' {
    interface JSX {
        IntrinsicElements: {
            [elemName: string]: any;
        };
    }
}

declare module 'd3' {
    export * from '@types/d3';
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
            svg: React.SVGProps<SVGSVGElement>;
            g: React.SVGProps<SVGGElement>;
            circle: React.SVGProps<SVGCircleElement>;
            text: React.SVGProps<SVGTextElement>;
            tspan: React.SVGProps<SVGTSpanElement>;
        }
    }
} 