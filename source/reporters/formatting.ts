export function camelToNormal(camelCaseString: string)
{
    return camelCaseString.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

export function titleCase(text: string)
{
    return text[0].toUpperCase() + text.slice(1).toLowerCase();
}

export function capitalCase(text: string)
{
    return text.split(" ").map(s => titleCase(s)).join(" ");
}