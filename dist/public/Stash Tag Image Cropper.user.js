// ==UserScript==
// @name        Stash Tag Image Cropper
// @namespace   https://github.com/stg-annon/stash-userscripts
// @description Adds an image cropper to tag page
// @version     0.1.1
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @resource    IMPORTED_CSS https://raw.githubusercontent.com/fengyuanchen/cropperjs/main/dist/cropper.min.css
// @grant       unsafeWindow
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @require     https://raw.githubusercontent.com/stg-annon/stash-userscripts/main/src\StashUserscriptLibrary.js
// @require     https://raw.githubusercontent.com/fengyuanchen/cropperjs/main/dist/cropper.min.js
// ==/UserScript==

/* global Cropper */

(function () {
    'use strict';

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        insertAfter,
        reloadImg,
    } = unsafeWindow.stash;

    const css = GM_getResourceText("IMPORTED_CSS");
    GM_addStyle(css);

    let cropping = false;
    let cropper = null;

    stash.addEventListener('page:tag:scenes', function () {
        waitForElementId('tag-tabs-tab-scenes', function () {
            const cropBtnContainerId = "crop-btn-container";
            if (!document.getElementById(cropBtnContainerId)) {
                const tagId = window.location.pathname.replace('/tags/', '').split('/')[0];
                const tagImage = getElementByXpath("//div[contains(@class, 'detail-header-image')]//img[@class='logo']");

                var cropperModal = document.createElement("dialog");
                cropperModal.style.width = "90%";
                cropperModal.style.border = "none";
                cropperModal.classList.add('bg-dark');
                document.body.appendChild(cropperModal);

                var cropperContainer = document.createElement("div");
                cropperContainer.style.width = "100%";
                cropperContainer.style.height = "auto";
                cropperContainer.style.margin = "auto";
                cropperModal.appendChild(cropperContainer);

                var image = tagImage.cloneNode();
                image.style.display = "block";
                image.style.maxWidth = "100%";
                cropperContainer.appendChild(image);
                
                var cropBtnContainer = document.createElement('div');
                cropBtnContainer.setAttribute("id", cropBtnContainerId);
                cropBtnContainer.classList.add('d-flex','flex-row','justify-content-center','align-items-center');
                cropBtnContainer.style.gap = "10px";
                cropperModal.appendChild(cropBtnContainer);

                const startCropContainer = document.createElement('div');
                startCropContainer.classList.add('d-flex','flex-column','justify-content-between','align-items-center');
                
                tagImage.parentElement.parentElement.appendChild(startCropContainer);
                tagImage.parentElement.parentElement.style.flexFlow = 'column';

                const cropInfo = document.createElement('p');
                cropInfo.style.all = "revert";
                cropInfo.classList.add('text-white');

                const headerImageContainer = document.querySelector('.detail-header-image')
                const cropStart = document.createElement('button');
                cropStart.setAttribute("id", "crop-start");
                cropStart.classList.add('btn', 'btn-link');
                cropStart.appendChild(tagImage)

                cropStart.addEventListener('click', evt => {
                    cropping = true;
                    cropStart.style.display = 'none';
                    cropCancel.style.display = 'inline-block';
    
                    cropper = new Cropper(image, {
                        viewMode: 1,
                        initialAspectRatio: 1,
                        movable: false,
                        rotatable: false,
                        scalable: false,
                        zoomable: false,
                        zoomOnTouch: false,
                        zoomOnWheel: false,
                        ready() {
                            cropAccept.style.display = 'inline-block';
                        },
                        crop(e) {
                            cropInfo.innerText = `X: ${Math.round(e.detail.x)}, Y: ${Math.round(e.detail.y)}, Width: ${Math.round(e.detail.width)}px, Height: ${Math.round(e.detail.height)}px`;
                        }
                    });
                    cropperModal.showModal();
                });
                headerImageContainer.appendChild(cropStart)
                
                const cropAccept = document.createElement('button');
                cropAccept.setAttribute("id", "crop-accept");
                cropAccept.classList.add('btn', 'btn-success', 'mr-2');
                cropAccept.innerText = 'OK';
                cropAccept.addEventListener('click', async evt => {
                    cropping = false;
                    cropStart.style.display = 'inline-block';
                    cropAccept.style.display = 'none';
                    cropCancel.style.display = 'none';
                    cropInfo.innerText = '';
    
                    const reqData = {
                        "operationName": "TagUpdate",
                        "variables": {
                          "input": {
                            "image": cropper.getCroppedCanvas().toDataURL(),
                            "id": tagId
                          }
                        },
                        "query": `mutation TagUpdate($input: TagUpdateInput!) {
                            tagUpdate(input: $input) {
                              id
                            }
                          }`
                    }
                    await stash.callGQL(reqData);
                    reloadImg(image.src);
                    cropper.destroy();
                    cropperModal.close("cropAccept");
                });
                cropBtnContainer.appendChild(cropAccept);
                
                const cropCancel = document.createElement('button');
                cropCancel.setAttribute("id", "crop-accept");
                cropCancel.classList.add('btn', 'btn-danger');
                cropCancel.innerText = 'Cancel';
                cropCancel.addEventListener('click', evt => {
                    cropping = false;
                    cropStart.style.display = 'inline-block';
                    cropAccept.style.display = 'none';
                    cropCancel.style.display = 'none';
                    cropInfo.innerText = '';
    
                    cropper.destroy();
                    cropperModal.close("cropCancel");
                });
                cropBtnContainer.appendChild(cropCancel);
                cropAccept.style.display = 'none';
                cropCancel.style.display = 'none';

                cropBtnContainer.appendChild(cropInfo);
            }
        });
    });
})();