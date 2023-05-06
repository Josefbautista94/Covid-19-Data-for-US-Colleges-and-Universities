import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import * as d3 from "d3";
import "./Frontpage.css";
import Chart from "chart.js";


function FrontPage() {
  const [confirmedCases, setConfirmedCases] = useState([]);
  const [showConfirmedCases, setShowConfirmedCases] = useState(false);
  const [selectedCity, setSelectedCity] = useState(""); // new state variable
  const [filteredData, setFilteredData] = useState([]);

  const svgRef = useRef(null);
  useEffect(() => {
    const dataByCity = confirmedCases.filter(
      (d) => d.city === selectedCity && d.cases !== ""
    );
    setFilteredData(dataByCity);
  }, [confirmedCases, selectedCity]);

  const cityOptions = [
    ...new Set(confirmedCases.map((d) => d.city).filter((d) => d !== "")),
  ];

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        "https://raw.githubusercontent.com/nytimes/covid-19-data/master/colleges/colleges.csv"
      );
      const data = await response.text();
      const parsedData = Papa.parse(data, { header: true }).data;
      const sortedData = parsedData.sort((a, b) =>
        a.city.localeCompare(b.city)
      ); // sort data by city
      setConfirmedCases(sortedData);
    };
    fetchData();
  }, []);

  const handleConfirmedCasesClick = () => {
    setShowConfirmedCases(true);

    const svg = d3.select(svgRef.current);
    const margin = { top: 50, right: 30, bottom: 70, left: 100 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    svg.selectAll("*").remove();
    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const casesByState = d3.group(confirmedCases, (d) => d.state);

    const xScale = d3
      .scaleBand()
      .domain([...casesByState.keys()])
      .range([0, width])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max([...casesByState.values()], (d) => d3.max(d, (d) => d.cases)),
      ])
      .range([height, 0]);

    const xAxis = d3.axisBottom(xScale);
    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    const yAxis = d3.axisLeft(yScale).ticks(10); // Add y-axis labels here
    svg.append("g").call(yAxis).selectAll("text").attr("font-size", "14px");

    svg
      .selectAll(".bar")
      .data([...casesByState])
      .join("g")
      .attr("class", "bar-group")
      .attr("transform", (d) => `translate(${xScale(d[0])},0)`)
      .selectAll(".bar")
      .data((d) => d[1])
      .join("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", (d) => yScale(d.cases))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - yScale(d.cases))
      .on("mouseover", (event, d) => {
        const tooltip = svg
          .append("g")
          .attr("class", "tooltip")
          .attr(
            "transform",
            `translate(${event.clientX}, ${event.clientY - 30})`
          );

        tooltip
          .append("rect")
          .attr("width", 80)
          .attr("height", 20)
          .attr("fill", "white")
          .attr("stroke", "black");

        tooltip
          .append("text")
          .attr("x", 40)
          .attr("y", 15)
          .attr("text-anchor", "middle")
          .text(d.cases);
      })
      .on("mouseout", () => {
        svg.selectAll(".tooltip").remove();
      });
  };

  return (
    <div className="front-page">
      <div className="header">
        <h1>COVID-19 Cases Reported On College And University Campuses</h1>
        <p>
          Data is based on reports from colleges and government sources and may
          lag. Cases include those of students, faculty, staff members and other
          college workers. Total cases include confirmed positive cases and
          probable cases, where available. Some colleges declined to provide
          data, provided partial data or did not respond to inquiries. Given the
          disparities in size, reopening plans and transparency among
          universities, it is not recommended to use this data to make
          campus-to-campus comparisons.
        </p>
      </div>
      <div className="chart-container">
        <div className="buttons">
          <button onClick={handleConfirmedCasesClick}>Confirmed cases</button>
        </div>
        {showConfirmedCases && (
          <div>
            <h2>Confirmed Cases by State </h2>
            <h3 className="graphInfo">
              This graph displays the confirmed cases of both 2020 and 2021 in
              all states. Click the button one more time to see the amount of
              cases per state, and hover over the bars for more details.
            </h3>
            <div className="chart">
              <svg ref={svgRef} />
            </div>
          </div>
        )}
      </div>
      <div className="city-container">
        <select value={selectedCity} onChange={handleCityChange}>
          <option value="">Select a city</option>
          {cityOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <table>
          <thead>
            <tr>
              <th>College</th>
              <th>Covid-19 Cases 2020 </th>
              <th>Covid-19 Cases 2021</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((d) => (
              <tr key={d.college}>
                <td>{d.college}</td>
                <td>{d.cases}</td>
                <td>{d.cases_2021}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>
          Presented here is a comprehensive chart showcasing all the cities in
          the United States, detailing the number of confirmed cases in both
          2020 and 2021. Additionally, the chart includes a breakdown of the
          total reported cases for each college within a given city.
        </h3>
      </div>
    </div>
  );
}

export default FrontPage;
