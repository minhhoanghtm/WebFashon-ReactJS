import Swal from "sweetalert2";

/**
 * Shared Monochrome Atelier SweetAlert2 wrapper
 * Sharp borders, Oswald display headings, Plus Jakarta Sans text, dark mode compatibility.
 */
export const monochromeSwal = Swal.mixin({
  customClass: {
    popup: "wf-swal-popup",
    title: "wf-swal-title",
    htmlContainer: "wf-swal-html",
    confirmButton: "wf-swal-confirm",
    cancelButton: "wf-swal-cancel",
    actions: "wf-swal-actions",
  },
  buttonsStyling: false,
});

export default monochromeSwal;
