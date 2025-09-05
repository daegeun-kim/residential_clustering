const vh = window.innerHeight / 1440;
const vw = window.innerWidth / 2560;
const width = 2000*vh;
const height = 500*vh;
const paddingY = 100*vh;

d3.json("nodeLink.json")
    .then(nodeLink => {
        const svg = d3.select("#nodelink")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

        const nodeById = new Map(nodeLink.nodes.map(d => [d.id, d]));

        const groupNames = Array.from(new Set(nodeLink.nodes.map(d => d.group)));
        const layers = {};
        groupNames.forEach(g => layers[g] = []);
        nodeLink.nodes.forEach(d => layers[d.group].push(d));

        Object.entries(layers).forEach(([group, nodes], i) => {
            const layerSpacing = 400;
            const totalLayoutWidth = (groupNames.length - 1) * layerSpacing;
            const offsetX = (width - totalLayoutWidth) / 2;
            nodes.forEach((node, j) => {
                node.x = offsetX + i * layerSpacing;
                node.y = paddingY + j * 26 - 36*vh;
            });
        });

        Object.entries(layers).forEach(([group, nodes], i) => {
            const layerSpacing = 400;
            const totalLayoutWidth = (groupNames.length - 1) * layerSpacing;
            const offsetX = (width - totalLayoutWidth) / 2;

            // vertical gap (with special rule for "cluster")
            const verticalGap = (group === "cluster") ? 100*vh : 40*vh;

            // total block height for this group
            const blockHeight = (nodes.length - 1) * verticalGap;

            // starting y so group is centered
            const startY = (height - blockHeight) / 2;

            nodes.forEach((node, j) => {
                node.x = offsetX + i * layerSpacing;
                node.y = startY + j * verticalGap;
            });
        });

        const linkGen = d3.linkHorizontal().x(d => d.x).y(d => d.y);

        svg.attr("viewBox", [0, 0, width, height])
        .attr("preserveAspectRatio", "xMidYMid meet");
        
        svg.selectAll("path.link")
        .data(nodeLink.links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d => {
            const r = 5;
            const s = nodeById.get(d.source);
            const t = nodeById.get(d.target);
            const dx = t.x - s.x;
            const sx = s.x + (dx > 0 ? r : -r);
            const tx = t.x - (dx > 0 ? r : -r);
            return linkGen({ source: { x: sx, y: s.y }, target: { x: tx, y: t.y } });
        })
        .attr("fill", "none")
        .attr("stroke", "#ffffffff")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 0.5)

        .attr("stroke-width", d => {
            if ((d.source === "4. Time to Closest Subway Station" && d.target === "Socio Spatial Cluster") ||
                (d.source === "3. Building Height" && d.target === "Socio Spatial Cluster") ||
                (d.source === "5. Average Property Value" && d.target === "Economic Financial Cluster") ||
                (d.source === "6. Property Value Per Sqft" && d.target === "Economic Financial Cluster") ||
                (d.source === "7. Property Value Increase 2024-2025" && d.target === "Economic Financial Cluster")) {
            return 5;
            }
            if ((d.source === "2. Building Construction Year" && d.target === "Evolutionary Cluster")) {
            return 8;
            }
            if ((d.source === "2. Building Construction Year" && d.target === "Evolutionary Cluster") ||
                (d.source === "3. Building Height" && d.target === "Evolutionary Cluster") ||
                (d.source === "1. Accessibility" && d.target === "Evolutionary Cluster")) {
            return 3;
            }
        });

        svg.selectAll("circle.node")
        .data(nodeLink.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 5)
        .attr("fill", "#ffffff");      // <- visible on dark bg

        svg.selectAll("text.label")
        .data(nodeLink.nodes)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => {
            if (d.group === "original data") return d.x - 20;
            return d.x + 20;
        })
        .attr("y", d => {
            return d.y;
        })
        .attr("text-anchor", d => {
            if (d.group === "original data") return "end";
            return "start";
        })
        .text(d => d.id)
        .attr("alignment-baseline", "middle")
        .attr("font-size", 12)
        .attr("fill", "#e5e7eb");      // <- readable text color
    })
    .catch(err => console.error("Failed to load nodeLink.json:", err));
