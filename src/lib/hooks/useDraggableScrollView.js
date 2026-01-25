import { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { mergeRefs } from '#/lib/merge-refs';
export function useDraggableScroll(_a) {
    var _b = _a === void 0 ? {} : _a, outerRef = _b.outerRef, _c = _b.cursor, cursor = _c === void 0 ? 'grab' : _c;
    var ref = useRef(null);
    useEffect(function () {
        if (Platform.OS !== 'web' || !ref.current) {
            return;
        }
        var slider = ref.current;
        var isDragging = false;
        var isMouseDown = false;
        var startX = 0;
        var scrollLeft = 0;
        var mouseDown = function (e) {
            isMouseDown = true;
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            slider.style.cursor = cursor;
        };
        var mouseUp = function () {
            if (isDragging) {
                slider.addEventListener('click', function (e) { return e.stopPropagation(); }, { once: true });
            }
            isMouseDown = false;
            isDragging = false;
            slider.style.cursor = 'default';
        };
        var mouseMove = function (e) {
            var _a, _b;
            if (!isMouseDown) {
                return;
            }
            // Require n pixels momement before start of drag (3 in this case )
            var x = e.pageX - slider.offsetLeft;
            if (Math.abs(x - startX) < 3) {
                return;
            }
            isDragging = true;
            e.preventDefault();
            var walk = x - startX;
            slider.scrollLeft = scrollLeft - walk;
            if (slider.contains(document.activeElement))
                (_b = (_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.blur) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        slider.addEventListener('mousedown', mouseDown);
        window.addEventListener('mouseup', mouseUp);
        window.addEventListener('mousemove', mouseMove);
        return function () {
            slider.removeEventListener('mousedown', mouseDown);
            window.removeEventListener('mouseup', mouseUp);
            window.removeEventListener('mousemove', mouseMove);
        };
    }, [cursor]);
    var refs = useMemo(function () { return mergeRefs(outerRef ? [ref, outerRef] : [ref]); }, [ref, outerRef]);
    return {
        refs: refs,
    };
}
