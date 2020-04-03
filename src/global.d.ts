import $ from 'jquery';

declare global {
    interface Window { $: any; }
}

window.$ = $;
