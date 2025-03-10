import { BlockStack, Box, Button, DatePicker, Icon, InlineGrid, Popover, InlineStack, TextField, useBreakpoints, Scrollable } from "@shopify/polaris";
import { useState, useEffect, useRef } from "react";
import { CalendarIcon, ArrowRightIcon } from "@shopify/polaris-icons"
export default function DateRangePicker({ setPlanDetail, planDetail }) {
    const { mdDown, lgUp } = useBreakpoints();
    const shouldShowMultiMonth = lgUp;
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const yesterday = new Date(
        new Date(new Date().setDate(today.getDate() - 1)).setHours(0, 0, 0, 0)
    );
    const ranges = [
        {
            title: "Custom",
            alias: "custom",
            period: {
                start: planDetail?.offerValidity.start,
                end: planDetail?.offerValidity.end,
            },
        },
    ];
    const [popoverActive, setPopoverActive] = useState(false);
    const [activeDateRange, setActiveDateRange] = useState(ranges[0]);
    const [inputValues, setInputValues] = useState({});
    const [{ month, year }, setDate] = useState({
        month: activeDateRange.period.start.getMonth(),
        year: activeDateRange.period.start.getFullYear(),
    });
    const datePickerRef = useRef(null);
    const VALID_YYYY_MM_DD_DATE_REGEX = /^\d{4}-\d{1,2}-\d{1,2}/;
    function isDate(date) {
        return !isNaN(new Date(date).getDate());
    }
    function isValidYearMonthDayDateString(date) {
        return VALID_YYYY_MM_DD_DATE_REGEX.test(date) && isDate(date);
    }
    function isValidDate(date) {
        return date.length === 10 && isValidYearMonthDayDateString(date);
    }
    function parseYearMonthDayDateString(input) {
        const [year, month, day] = input.split("-");
        return new Date(Number(year), Number(month) - 1, Number(day));
    }
    function formatDateToYearMonthDayDateString(date) {
        const year = String(date.getFullYear());
        let month = String(date.getMonth() + 1);
        let day = String(date.getDate());
        if (month.length < 2) {
            month = String(month).padStart(2, "0");
        }
        if (day.length < 2) {
            day = String(day).padStart(2, "0");
        }
        return [year, month, day].join("-");
    }
    function formatDate(date) {
        return formatDateToYearMonthDayDateString(date);
    }
    function nodeContainsDescendant(rootNode, descendant) {
        if (rootNode === descendant) {
            return true;
        }
        let parent = descendant.parentNode;
        while (parent != null) {
            if (parent === rootNode) {
                return true;
            }
            parent = parent.parentNode;
        }
        return false;
    }
    function isNodeWithinPopover(node) {
        return datePickerRef?.current
            ? nodeContainsDescendant(datePickerRef.current, node)
            : false;
    }
    function handleStartInputValueChange(value) {
        setInputValues((prevState) => {
            return { ...prevState, start: value };
        });
        if (isValidDate(value)) {
            const newSince = parseYearMonthDayDateString(value);
            setActiveDateRange((prevState) => {
                const newPeriod =
                    prevState.period && newSince <= prevState.period.end
                        ? { start: newSince, end: prevState.period.end }
                        : { start: newSince, end: newSince };
                return {
                    ...prevState,
                    period: newPeriod,
                };
            });
           
        }
    }
    function handleEndInputValueChange(value) {
        setInputValues((prevState) => ({ ...prevState, end: value }));
        if (isValidDate(value)) {
            const newUntil = parseYearMonthDayDateString(value);
            setActiveDateRange((prevState) => {
                const newPeriod =
                    prevState.period && newUntil >= prevState.period.start
                        ? { start: prevState.period.start, end: newUntil }
                        : { start: newUntil, end: newUntil };
                return {
                    ...prevState,
                    period: newPeriod,
                };
            });
        }
    }
    function handleInputBlur({ relatedTarget }) {
        const isRelatedTargetWithinPopover =
            relatedTarget != null && isNodeWithinPopover(relatedTarget);
        if (isRelatedTargetWithinPopover) {
            return;
        }
        setPopoverActive(false);
    }


    function handleMonthChange(month, year) {
        setDate({ month, year });
    }


    function handleCalendarChange({ start, end }) {
        const newDateRange = ranges.find((range) => {
            return (
                range.period.start.valueOf() === start.valueOf() &&
                range.period.end.valueOf() === end.valueOf()
            );
        }) || {
            alias: "custom",
            title: "Custom",
            period: {
                start: start,
                end: end,
            },
        };
        setActiveDateRange(newDateRange);
    }
    function apply() {
        setPopoverActive(false);
    }
    function cancel() {
        setPopoverActive(false);
    }
    useEffect(() => {
        if (activeDateRange) {
            setInputValues({
                start: formatDate(activeDateRange.period.start),
                end: formatDate(activeDateRange.period.end),
            });
            function monthDiff(referenceDate, newDate) {
                return (
                    newDate.month -
                    referenceDate.month +
                    12 * (referenceDate.year - newDate.year)
                );
            }
            const monthDifference = monthDiff(
                { year, month },
                {
                    year: activeDateRange.period.end.getFullYear(),
                    month: activeDateRange.period.end.getMonth(),
                }
            );
            if (monthDifference > 1 || monthDifference < 0) {
                setDate({
                    month: activeDateRange.period.end.getMonth(),
                    year: activeDateRange.period.end.getFullYear(),
                });
            }
            setPlanDetail({ ...planDetail, offerValidity: activeDateRange?.period })
        }
    }, [activeDateRange]);
    const buttonValue =
        activeDateRange.title === "Custom"
            ? activeDateRange.period.start.toDateString() +
            " - " +
            activeDateRange.period.end.toDateString()
            : activeDateRange.title;
    return (
       
        <Popover
            active={popoverActive}
            autofocusTarget="none"
            preferredAlignment="left"
            preferredPosition="below"
            fluidContent
            sectioned={false}
            fullHeight
            activator={
                <Button
                    size="slim"
                    icon={CalendarIcon}
                    onClick={() => setPopoverActive(!popoverActive)}
                >
                    {buttonValue}
                </Button>
            }
            onClose={() => setPopoverActive(false)}
        >
             <Scrollable shadow style={{height: '450px'}} focusable>
            <Popover.Pane fixed>
                <InlineGrid
                    columns={{
                        xs: "1fr",
                        mdDown: "1fr",
                        md: "max-content max-content",
                    }}
                    gap={0}
                    ref={datePickerRef}
                >
                    <Box padding={{ xs: 500 }} maxWidth={mdDown ? "320px" : "516px"}>
                        <BlockStack gap="400">
                            <InlineStack gap="200">
                                <div style={{ flexGrow: 1 }}>
                                    <TextField
                                        role="combobox"
                                        label={"Since"}
                                        labelHidden
                                        prefix={<Icon source={CalendarIcon} />}
                                        value={inputValues.start}
                                        onChange={handleStartInputValueChange}
                                        onBlur={handleInputBlur}
                                        autoComplete="off"
                                    />
                                </div>
                                <Icon source={ArrowRightIcon} />
                                <div style={{ flexGrow: 1 }}>
                                    <TextField
                                        role="combobox"
                                        label={"Until"}
                                        labelHidden
                                        prefix={<Icon source={CalendarIcon} />}
                                        value={inputValues.end}
                                        onChange={handleEndInputValueChange}
                                        onBlur={handleInputBlur}
                                        autoComplete="off"
                                    />
                                </div>
                            </InlineStack>
                            <div>
                                <DatePicker
                                    month={month}
                                    year={year}
                                    selected={{
                                        start: activeDateRange.period.start,
                                        end: activeDateRange.period.end,
                                    }}
                                    onMonthChange={handleMonthChange}
                                    onChange={handleCalendarChange}
                                    multiMonth={shouldShowMultiMonth}
                                    allowRange
                                />
                            </div>
                        </BlockStack>
                    </Box>
                </InlineGrid>
            </Popover.Pane>
            <Popover.Pane fixed>
                <Popover.Section>
                    <InlineStack align="end">
                        <Button onClick={cancel}>Cancel</Button>
                        <Button primary onClick={apply}>
                            Apply
                        </Button>
                    </InlineStack>
                </Popover.Section>
            </Popover.Pane>
            </Scrollable>
        </Popover>
    )
}