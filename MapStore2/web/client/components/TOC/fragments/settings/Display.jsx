/*
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'react-widgets/lib/less/react-widgets.less';

import { clamp, isNil, isNumber } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Checkbox, Col, ControlLabel, FormGroup, Grid, Row } from 'react-bootstrap';

import IntlNumberFormControl from '../../../I18N/IntlNumberFormControl';
import Message from '../../../I18N/Message';
import InfoPopover from '../../../widgets/widget/InfoPopover';
import Legend from '../legend/Legend';
import VisibilityLimitsForm from './VisibilityLimitsForm';
import Select from 'react-select';
export default class extends React.Component {
    static propTypes = {
        opacityText: PropTypes.node,
        element: PropTypes.object,
        formats: PropTypes.array,
        settings: PropTypes.object,
        onChange: PropTypes.func,
        containerWidth: PropTypes.number,
        currentLocaleLanguage: PropTypes.string,
        isLocalizedLayerStylesEnabled: PropTypes.bool,
        projection: PropTypes.string,
        resolutions: PropTypes.array,
        zoom: PropTypes.number
    };

    static defaultProps = {
        onChange: () => {},
        opacityText: <Message msgId="opacity"/>
    };

    constructor(props) {
        super(props);
        this.containerRef = React.createRef();
    }

    state = {
        opacity: 100,
        legendOptions: {
            legendWidth: 12,
            legendHeight: 12
        },
        containerStyle: {overflowX: 'auto'},
        containerWidth: 0
    };

    componentDidMount() {
        this.updateState(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (this.props !== nextProps) {
            this.updateState(nextProps);
        }
    }

    onChange = (name, value) =>{
        if (name === 'opacity') {
            const opacity = value && clamp(Math.round(value), 0, 100);
            this.setState({opacity, ...this.state});
            this.props.onChange("opacity", opacity && (opacity / 100) || 0);
        } else {
            const legendValues = value && clamp(Math.round(value), 0, 1000);
            this.setState({
                ...this.state,
                legendOptions: {
                    ...this.state.legendOptions,
                    [name]: legendValues
                }});
            this.props.onChange({
                legendOptions: {
                    ...this.state.legendOptions,
                    [name]: legendValues
                }
            });
        }
    };

    onBlur = (event) => {
        const value = event.target.value && Math.round(event.target.value);
        const name = event.target.name;
        const defaultSize = 12;
        this.props.onChange({
            legendOptions: {
                ...this.state.legendOptions,
                [name]: value >= defaultSize ? value : ""
            }
        });
    };

    getValidationState = (name) =>{
        if (this.state.legendOptions && this.state.legendOptions[name]) {
            return parseInt(this.state.legendOptions[name], 10) < 12 && "error";
        }
        return null;
    };
    render() {
        return (
            <Grid
                fluid
                className={"fluid-container ms-display-form " + (!this.props.containerWidth && "adjust-display")}>
                {this.props.element.type === "wms" &&
                <Row>
                    <Col xs={12}>
                        <FormGroup>
                            <ControlLabel><Message msgId="layerProperties.format" /></ControlLabel>
                            <Select
                                key="format-dropdown"
                                clearable={false}
                                options={(this.props.formats || ["image/png", "image/png8", "image/jpeg", "image/vnd.jpeg-png", "image/gif"])
                                    .map((value) => ({ value, label: value }))}
                                value={this.props.element && this.props.element.format || "image/png"}
                                onChange={({ value }) => {
                                    this.props.onChange("format", value);
                                }}/>
                        </FormGroup>
                    </Col>
                    <Col xs={12}>
                        <FormGroup>
                            <ControlLabel><Message msgId="WMS Layer tile size" /></ControlLabel>
                            <Select
                                key="wsm-layersize-dropdown"
                                clearable={false}
                                options={[{ value: 256, label: 256 }, { value: 512, label: 512 }]}
                                value={this.props.element && this.props.element.tileSize || 256}
                                onChange={({ value }) => {
                                    this.props.onChange("tileSize", value);
                                }}/>
                        </FormGroup>
                    </Col>
                </Row>}

                <Row>
                    <Col xs={12}>
                        <FormGroup>
                            <ControlLabel>{this.props.opacityText} %</ControlLabel>
                            <IntlNumberFormControl
                                type="number"
                                min={0}
                                max={100}
                                name={"opacity"}
                                value={this.state.opacity}
                                onChange={(val)=> this.onChange("opacity", val)}/>
                        </FormGroup>
                    </Col>
                </Row>

                <Row>
                    <Col xs={12}>
                        <FormGroup>
                            <VisibilityLimitsForm
                                title={<ControlLabel><Message msgId="layerProperties.visibilityLimits.title"/></ControlLabel>}
                                layer={this.props.element}
                                onChange={this.props.onChange}
                                projection={this.props.projection}
                                resolutions={this.props.resolutions}
                                zoom={this.props.zoom}
                            />
                        </FormGroup>
                    </Col>
                </Row>

                {this.props.element.type === "wms" &&
                <Row>
                    <Col xs={12}>
                        <hr/>
                        <FormGroup>
                            <Checkbox key="transparent" checked={this.props.element && (this.props.element.transparent === undefined ? true : this.props.element.transparent)} onChange={(event) => {this.props.onChange("transparent", event.target.checked); }}>
                                <Message msgId="layerProperties.transparent"/></Checkbox>
                            <Checkbox value="tiled" key="tiled"
                                disabled={!!this.props.element.singleTile}
                                onChange={(e) => this.props.onChange("tiled", e.target.checked)}
                                checked={this.props.element && this.props.element.tiled !== undefined ? this.props.element.tiled : true} >
                                <Message msgId="layerProperties.cached"/>
                            </Checkbox>
                            <Checkbox key="singleTile" value="singleTile"
                                checked={this.props.element && (this.props.element.singleTile !== undefined ? this.props.element.singleTile : false )}
                                onChange={(e) => this.props.onChange("singleTile", e.target.checked)}>
                                <Message msgId="layerProperties.singleTile"/>
                            </Checkbox>
                            {(this.props.isLocalizedLayerStylesEnabled && (
                                <Checkbox key="localizedLayerStyles" value="localizedLayerStyles"
                                    data-qa="display-lacalized-layer-styles-option"
                                    checked={this.props.element && (this.props.element.localizedLayerStyles !== undefined ? this.props.element.localizedLayerStyles : false )}
                                    onChange={(e) => this.props.onChange("localizedLayerStyles", e.target.checked)}>
                                    <Message msgId="layerProperties.enableLocalizedLayerStyles.label" />&nbsp;<InfoPopover text={<Message msgId="layerProperties.enableLocalizedLayerStyles.tooltip" />} />
                                </Checkbox>))}
                        </FormGroup>
                    </Col>
                    <div className={"legend-options"}>
                        <Col xs={12} className={"legend-label"}>
                            <label key="legend-options-title" className="control-label"><Message msgId="layerProperties.legendOptions.title" /></label>
                        </Col>
                        <Col xs={12} sm={6} className="first-selectize">
                            <FormGroup validationState={this.getValidationState("legendWidth")}>
                                <ControlLabel><Message msgId="layerProperties.legendOptions.legendWidth" /></ControlLabel>
                                <IntlNumberFormControl
                                    value={this.state.legendOptions.legendWidth}
                                    name="legendWidth"
                                    type="number"
                                    min={12}
                                    max={1000}
                                    onChange={(val)=> this.onChange("legendWidth", val)}
                                    onKeyPress={(e)=> e.key === "-" && e.preventDefault()}
                                    onBlur={this.onBlur}
                                />
                            </FormGroup>
                        </Col>
                        <Col xs={12} sm={6} className="second-selectize">
                            <FormGroup validationState={this.getValidationState("legendHeight")}>
                                <ControlLabel><Message msgId="layerProperties.legendOptions.legendHeight" /></ControlLabel>
                                <IntlNumberFormControl
                                    value={this.state.legendOptions.legendHeight}
                                    name="legendHeight"
                                    type="number"
                                    min={12}
                                    max={1000}
                                    onChange={(val)=> this.onChange("legendHeight", val)}
                                    onKeyPress={(e)=> e.key === "-" && e.preventDefault()}
                                    onBlur={this.onBlur}
                                />
                            </FormGroup>
                        </Col>
                        <Col xs={12} className="legend-preview">
                            <ControlLabel><Message msgId="layerProperties.legendOptions.legendPreview" /></ControlLabel>
                            <div style={this.setOverFlow() && this.state.containerStyle || {}} ref={this.containerRef} >
                                <Legend
                                    style={this.setOverFlow() && {} || undefined}
                                    layer={this.props.element}
                                    legendHeight={
                                        this.useLegendOptions() && this.state.legendOptions.legendHeight || undefined}
                                    legendWidth={
                                        this.useLegendOptions() && this.state.legendOptions.legendWidth || undefined}
                                    language={
                                        this.props.isLocalizedLayerStylesEnabled ? this.props.currentLocaleLanguage : undefined}
                                />
                            </div>
                        </Col>
                    </div>
                </Row>}
            </Grid>
        );
    }
    updateState = (props) =>{
        if (props.settings && props.settings.options) {
            this.setState({
                ...this.state,
                opacity: !isNil(props.settings.options.opacity) ? Math.round(props.settings.options.opacity * 100) : this.state.opacity,
                legendOptions: {
                    ...this.state.legendOptions,
                    legendHeight: props.element.legendOptions && !isNil(props.element.legendOptions.legendHeight) ?
                        props.element.legendOptions.legendHeight : this.state.legendOptions.legendHeight,
                    legendWidth: props.element.legendOptions && !isNil(props.element.legendOptions.legendWidth) ?
                        props.element.legendOptions.legendWidth : this.state.legendOptions.legendWidth
                },
                containerWidth: this.containerRef.current && this.containerRef.current.clientWidth
            });
        }
    };

    setOverFlow = () =>{
        return this.state.legendOptions.legendWidth > this.state.containerWidth;
    };

    useLegendOptions = () =>{
        return (
            this.getValidationState("legendWidth") !== 'error' &&
            this.getValidationState("legendHeight") !== 'error' &&
            isNumber(this.state.legendOptions.legendHeight) &&
            isNumber(this.state.legendOptions.legendWidth)
        );
    };


}
