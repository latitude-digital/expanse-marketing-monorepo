import { SvgRegistry } from "survey-core";

// Function to register all the SVG icons
const registerIcons = async (svgFileNames: string[], iconCategory?: string) => {
  if (!iconCategory) {
    iconCategory = "sharp-regular";
  }
  // Iterate through each SVG file name
  svgFileNames.forEach(async (fileName) => {
    // Skip empty lines
    if (fileName === "") return;

    try {
      // Import the SVG file as a React component
      const SvgIcon = await import(`../assets/icons/${iconCategory}/${fileName}.svg`);

      // fetch the contents of SvgIcon.default
      const svgString = await fetch(SvgIcon.default).then(res => res.text());

      // Extract the icon name from the file name
      const iconName = `icon-${fileName.replace(".svg", "")}`;

      // Register the icon with a unique name
      SvgRegistry.registerIconFromSvg(iconName, svgString);
    } catch (error) {
      console.error(`Error registering icon: ${iconCategory} ${fileName}`, error);
    }
  });
};

// Function to register all the SVG icons
const registerIconManually = async (iconName: string, fileName: string, iconCategory?: string) => {
  if (!iconCategory) {
    console.log("no iconCategory", iconCategory);
    iconCategory = "sharp-regular";
  }

  try {
    // Import the SVG file as a React component
    const SvgIcon = await import(`../assets/icons/${iconCategory}/${fileName}.svg`);

    // fetch the contents of SvgIcon.default
    const svgString = await fetch(SvgIcon.default).then(res => res.text());

    // Register the icon
    SvgRegistry.registerIconFromSvg(iconName, svgString);
  } catch (error) {
    console.error(`Error registering icon: ${iconCategory} ${fileName}`, error);
  }
};

export { registerIcons, registerIconManually };
