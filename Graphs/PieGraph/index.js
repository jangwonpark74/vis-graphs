import PropTypes from 'prop-types';
import React from "react";

import AbstractGraph from "../AbstractGraph";

import * as d3 from "d3";

import "./style.css";

import {properties} from "./default.config"
import { filterEmptyData, limit } from "../../utils/helpers"


export default class PieGraph extends AbstractGraph {

    constructor(props) {
        super(props, properties);
    }

    getColor = (scale) => {
        const {
            stroke,
            colorColumn,
            labelColumn,
            colors,
            legendColumn,
            emptyBoxColor
        } = this.getConfiguredProperties()


        return (d) => {
            let value = null
            if (d.hasOwnProperty(legendColumn)) {
                value = d[legendColumn]
            } else if (d.hasOwnProperty(colorColumn)) {
                value = d[colorColumn]
            } else if (d.hasOwnProperty(labelColumn)) {
                value = d[labelColumn]
            } else if (d.hasOwnProperty("key")) {
                value = d["key"]
            }

            if (value === 'Empty') {
                return emptyBoxColor
            }
            return scale ? scale(value) : stroke.color || colors[0];
        }

    }

    render() {
        const {
            data: originalData,
            height,
            width,
            onMarkClick
        } = this.props;

        const {
            graphHeight,
            graphWidth,
            legendHeight,
            legendWidth
        } = this.getGraphDimension();

        if (!originalData || !originalData.length)
            return this.renderMessage("No data to visualize");

        const {
          chartWidthToPixel,
          circleToPixel,
          colorColumn,
          sliceColumn,
          labelColumn,
          legend,
          margin,
          pieInnerRadius,
          pieOuterRadius,
          pieLabelRadius,
          stroke,
          fontColor,
          percentages,
          percentagesFormat,
          otherOptions,
          showZero,
          mappedColors,
          labelCount
        } = this.getConfiguredProperties();


        /*
        Add below code snippet in visulaization's configuration json files
        to use grouping data feature

        "others": {
            "label": "Others",
            "limit": 5
        }

        */
        const settings = {
            "metric": sliceColumn,
            "dimension": labelColumn,
            "limitOption": otherOptions
          };

        const data =  limit({
            data: filterEmptyData({
                data: originalData,
                column: sliceColumn,
                showZero:showZero
            }),
            ...settings
        })

        if (!data || !data.length)
            return this.renderMessage("No data to visualize")

        let availableWidth     = graphWidth - (margin.left + margin.right);
        let availableHeight    = graphHeight - (margin.top + margin.bottom);

        const isVerticalLegend = legend.orientation === 'vertical';
        const value            = (d) => d[sliceColumn];
        const label            = (d) => d[labelColumn];
        const scale            = mappedColors ?
            this.getMappedScaleColor(data, labelColumn) : this.scaleColor(data, labelColumn);

        const getColor         = mappedColors ?
            this.getColor(scale) : (d) => scale ? scale(d[colorColumn || labelColumn]) : null;

        if (legend.show && data.length > 1)
        {
            // Extract the longest legend
            // Store the info in legend for convenience
            legend.width = this.longestLabelLength(data, label) * chartWidthToPixel;

            if (!legend.separate) {
                // Compute the available space considering a legend
                if (isVerticalLegend)
                    availableWidth -= legend.width;
                else
                    availableHeight -= (data.length - 1) * legend.circleSize * circleToPixel;
            }
        }

        const maxRadius   = Math.min(availableWidth, availableHeight) / 2;
        const innerRadius = pieInnerRadius * maxRadius;
        const outerRadius = pieOuterRadius * maxRadius;
        const labelRadius = pieLabelRadius * maxRadius;

        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        const labelArc = d3.arc()
            .innerRadius(labelRadius)
            .outerRadius(labelRadius);

        const pie    = d3.pie().value(value).sort(null);
        const slices = pie(data);

        const labelText = (() => {
            if (percentages) {
                const percentageFormat = d3.format(percentagesFormat || ",.2%");
                const sum              = d3.sum(data, value);
                return (d) => percentageFormat(value(d) / sum);
            }
            return label;
        })();

        const style = {
            strokeStyle: {
                strokeWidth: stroke.width,
                stroke: stroke.color
            },
            graphStyle: {
                width: graphWidth,
                height: graphHeight
            },
            legendStyle: {
                width: legendWidth,
                height: legendHeight,
                display: isVerticalLegend ? 'grid' : 'inline-block'
            }
        };

        return (
            <div className="pie-graph">
                {this.tooltip}
                <div style={{ height, width}}>
                    <div className='graphContainer' style={ style.graphStyle }>
                        <svg width={ graphWidth } height={ graphHeight }>
                            <g className = {'pieGraph'} transform={ `translate(${ graphWidth / 2 }, ${ graphHeight / 2 })` } >
                                {
                                    slices.map((slice, i) => {
                                        const d = slice.data;

                                        // Set up clicking and cursor style.
                                        const { onClick, cursor } = (
                                            onMarkClick && (!otherOptions || d[settings.dimension] !== otherOptions.label) ? {
                                                onClick: () => onMarkClick(d),
                                                cursor: "pointer"
                                            } : { }
                                        );

                                        const textAnchor = (
                                        (pieLabelRadius > pieOuterRadius)
                                        ? ((slice.startAngle + slice.endAngle) / 2 < Math.PI ? "start" : "end")
                                        : "middle"
                                        );

                                        return <g className="section" key={i} >
                                            <path
                                            d={ arc(slice) }
                                            fill={ getColor(d) }
                                            onClick={ onClick }
                                            style={ Object.assign({cursor}, style.strokeStyle) }
                                            { ...this.tooltipProps(d) }
                                            />
                                            <text
                                            transform={`translate(${labelArc.centroid(slice)})`}
                                            textAnchor={ textAnchor }
                                            dy=".35em"
                                            fill={ fontColor }
                                            onClick={ onClick }
                                            style={{cursor}}
                                            { ...this.tooltipProps(d) }
                                            >
                                                { labelCount >= slices.length ? labelText(slice.data) : '' }
                                            </text>
                                        </g>
                                    })
                                }
                            </g>
                            {this.renderLegend(data, legend, getColor, label, legendHeight)}
                        </svg>
                    </div>
                    <div className='legendContainer' style={style.legendStyle}>
                        {this.renderLegend(data, legend, getColor, label)}
                    </div>
                </div>
            </div>
        );
    }
}

PieGraph.propTypes = {
  configuration: PropTypes.object,
  data: PropTypes.array
};
