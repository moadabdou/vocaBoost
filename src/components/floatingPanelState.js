import {marked} from '../tools/marked.min';
import wordTransactions from '../transactions/wordtransaction';
import vcbLogging from '../helpers/logging';

//https://forums.ankiweb.net/t/an-info-tip-regarding-recommended-button-usage/39834

const wordtrasactions = new  wordTransactions();
const vcblog = new vcbLogging();

function removeActiveClasses(){
    document.querySelectorAll('.vocaBoost-word-info > div').forEach(el => {
        el.classList.remove('active')
    })
}

/**
 * @typedef {Object} Actions
 * @property {Function}  afterClosing
 */


class floatingPanelState{
    /**
     * 
     * @param {Actions} actions 
     */
    constructor (actions){
        //current chosen  word  
        this.currentWord = '' ;
        this.actions = actions;
        
        //open & close animation
        this.animate =  false;

        //dragging  the panel
        this.isDragging = false;
        this.offsetX;
        this.offsetY;

        //for drop zone  
        this.dropZone ;

        //textarea 
        this.textarea;

        //for line numbers  imploading position 
        this.positionIndecator;
        this.selectedPositionToUpload;

        //navigation keys
        this.CLASSES = {
            NOINFO : 'vocaBoost-word-noinfo' , 
            INFO : 'vocaBoost-word-show' ,
            NEWINFO : 'vocaBoost-word-new '
        }




        this.floatingPanel  = document.createElement('div');
        this.floatingPanel.classList.add('vocaBoost-floating-panel' , 'hidden' , (this.animate? 'animate' : 'default'))
        this.floatingPanel.innerHTML = /*html */`  
            <div class="vocaBoost-container" >
                <div class="vocaBoost-word">
                    <h3>the word</h3>
                </div>
                <div class="vocaBoost-word-info">
                    <span class="vcb-close"></span>
                    <div class="vcb-loading-cover show-loader">
                        <div class="vcb-loader"></div>
                    </div> 
                    <div class="vocaBoost-word-noinfo ">
                        <h3>word not found </h3>
                        <p>to add this word click <span>here</span></p>
                    </div>
                    <div class="vocaBoost-word-new  active">
                        <h3>add this word : </h3>
                        <p>When adding word definitions, please write them using Markdown syntax.
                        If you're unsure how to format your definition, you can ask an AI tool like ChatGPT to generate the Markdown for you. </p>
                        <div class="new-word-container">
                            <div class="vcb-drop-zone vcb-hidden" id="vcb-drop-zone">
                                <div class="vcb-dropzone-close"></div>
                                <p>Drag & Drop your picture here (click if want to upload  from device) <br> [!] avoid large file to  maintain efficiency </p>
                            </div>               
                            <div class="upload-img-positon"></div>
                            <div class="line-numbers" id="line-numbers" title= 'choose a  line to insert an image'></div>
                            <textarea id="textarea" wrap="off"></textarea>
                        </div>
                        <button>add this word</button>
                    </div>
                    <div class="vocaBoost-word-show">
                        <div class="word-infos"></div>
                        <button>edit this word</button>
                    </div>
                </div>
            </div>
        `
        document.body.appendChild(this.floatingPanel)

        //setting up panel props  
        this.textarea = document.querySelector('.vocaBoost-word-new .new-word-container textarea');
        this.lineNumbers = document.querySelector('.vocaBoost-word-new .new-word-container .line-numbers');
        this.positionIndecator = document.querySelector('.vocaBoost-word-new .new-word-container .upload-img-positon');
        this.dropZone = document.getElementById('vcb-drop-zone');

        //updating line numbers 
        this.setUpdateLineNumbers()

        //dragging the  floating panel 
        this.setupDragging ()

        //setup navigation
        this.setupNavigation()

        //setup  dropZone 
        this.setupDropZoneHandlers()

    }

    setupNavigation(){
        //show the section of  adding  new  word 
        document.querySelector('.vocaBoost-word-noinfo span').addEventListener('click' , ()=>{
            const wordDefintions =  document.querySelector('.vocaBoost-word-new textarea') ;
            wordDefintions.value = '';
            this.showAwordPage('NEWINFO');
        })

        //add new word the  new  word button pressed 
        document.querySelector('.vocaBoost-word-new button').addEventListener('click' ,  (e)=>{
            if(this.textarea.value){
                this.loader('HIDE');
                wordtrasactions.setNewWord({
                    word :  this.currentWord  , 
                    content : this.textarea.value
                } ,  isWordAdded => {
                    if (isWordAdded){
                        this.showAwordPage('INFO' ,  this.textarea.value);
                    }
                    this.loader('HIDE');
                });
            }
        })

        //edit existing  word 
        document.querySelector('.vocaBoost-word-show button').addEventListener('click' ,  (e)=>{
            this.showAwordPage('NEWINFO' , {dontEraseTextArea : true});
        })

        //close the  panel 
        document.querySelector('.vocaBoost-word-info .vcb-close').addEventListener('click' , e=>{
            this.hidePanel();
            if (this.actions.afterClosing){
                this.actions.afterClosing();
            }
        })
    }

    setupDragging (){
        document.querySelector('.vocaBoost-word').addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.floatingPanel.classList.remove('animate');
            this.offsetX = e.clientX - this.floatingPanel.offsetLeft;
            this.offsetY = e.clientY - this.floatingPanel.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const  Top = e.clientY - this.offsetY ;
                this.floatingPanel.style.left = e.clientX - this.offsetX + 'px';
                this.floatingPanel.style.top = (Top >= 0 ? Top : 0) + 'px';
                this.floatingPanel.style.cursor = 'move';
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.floatingPanel.classList.add((this.animate? 'animate' : 'default'));
            this.floatingPanel.style.cursor = 'default';
        });

    }

    handelImage(img){
        let wordDefinitions =   this.textarea.value.split('\n');

        img =  `![defintion image](${img})`; // turn  image  into  markedown syntax

        wordDefinitions.splice(this.selectedPositionToUpload , 0 , img);
        this.showAwordPage('INFO' ,  wordDefinitions.join('\n'))
        wordtrasactions.setNewWord({
            word :  this.currentWord  , 
            content : this.textarea.value
        } ,  isWordAdded => {
            if(isWordAdded){
                //to do
            }
            this.loader('HIDE');
        });

    }

    setupDropZoneHandlers(){

        document.querySelector('.vcb-dropzone-close').addEventListener('click' , ()=>{
            this.dropZone.classList.add('vcb-hidden');
        })
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();  // Prevent default behavior (prevent file from being opened)
            this.dropZone.classList.add('dragover');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });

        this.dropZone.addEventListener('click' ,  (e)=> {
            const inputElement = document.createElement('input');
            inputElement.type = 'file'; 
            inputElement.onchange = (event)=> {
                this.dropZone.classList.remove('dragover');  
                this.loader('SHOW');
                const files = event.target.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    const file = files[0];
                    const reader = new FileReader();
    
                    reader.onload =  (event) => {
                        this.handelImage(event.target.result)
                    };
                    reader.readAsDataURL(file);
                }
            };
            inputElement.click(); // This opens the file picker
        }) 
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');  
            this.loader('SHOW');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                const file = files[0];
                const reader = new FileReader();

                reader.onload =  (event) => {
                    this.handelImage(event.target.result)
                };


                reader.readAsDataURL(file);
            } else {
                const text = e.dataTransfer.getData('text/html');
                // Create a DOM parser to parse the HTML content
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                // Extract the first image URL (adjust the selector as needed)
                const imageElement = doc.querySelector('img');
                
                if (imageElement) {
                    const imageUrl =  imageElement.src;
                    // Send the URL to background.js
                    chrome.runtime.sendMessage({ action: 'convertToBase64', imageUrl: imageUrl }, (response) => {
                        if (response.base64Image) {
                            this.handelImage(response.base64Image)
                        } else {
                            vcblog.error('[vocaBoost] :' , 'Failed to convert image to Base64');
                            this.loader('HIDE');
                        }
                    });
                } else {
                    this.loader('HIDE');
                    alert('Please drop a valid image URL.');
                }
            }
        });
    }


    setupImageUploadingPosition (){
        const lineSpans          = document.querySelectorAll('.vocaBoost-word-new .new-word-container span'),
              linesContainer     = document.querySelector('.vocaBoost-word-new .new-word-container');

        lineSpans.forEach(lineSpan => {
            lineSpan.addEventListener('mouseover' ,  (e)=> {
                const lineNumberRectBound =  lineSpan.getBoundingClientRect();
                const containerRectBount  =  linesContainer.getBoundingClientRect() ;
                this.positionIndecator.classList.remove('vcb-hidden');
                this.positionIndecator.style.left  =  lineNumberRectBound.left - containerRectBount.left +'px';
                this.positionIndecator.style.top  =  lineNumberRectBound.bottom - containerRectBount.top +'px';
            })

            lineSpan.addEventListener('click' , ()=> {
                this.selectedPositionToUpload = Number(lineSpan.textContent); 
                this.dropZone.classList.remove('vcb-hidden');
            })
        })
    }

    updateLineNumbers(){
        this.positionIndecator.classList.add('vcb-hidden');
        this.lineNumbers.style.height =  this.textarea.clientHeight + 'px';
        const lineCount = this.textarea.value.split('\n').length;
        this.lineNumbers.innerHTML = '';

        for (let i = 1; i <= lineCount; i++) {
            this.lineNumbers.innerHTML += `<span>${i}</span>`;
        }
        this.setupImageUploadingPosition();
    }

    setUpdateLineNumbers (){
        
        this.textarea.addEventListener('input' , ()=>{
            this.updateLineNumbers();
        })

        // Create a new ResizeObserver instance
        const resizeObserver = new ResizeObserver(entries => {
            this.lineNumbers.style.height = entries[0].target.clientHeight + 'px';
        });

        // Observe the textarea for size changes
        resizeObserver.observe(this.textarea);

        this.textarea.addEventListener('scroll' , ()=>{
            this.positionIndecator.classList.add('vcb-hidden');
            this.lineNumbers.scrollTop = this.textarea.scrollTop;
        })
    }
    
    setWord (word){
        //show the word 
        document.querySelector('.vocaBoost-word h3').textContent = word ;
        this.currentWord  = word ;
        this.loader('SHOW');
        wordtrasactions.checkWordExistence(word ,  isThisWordExist=> {
            if (isThisWordExist){
                this.showAwordPage('INFO', isThisWordExist.content );
            }else {
                this.showAwordPage('NOINFO');
            }
            this.loader('HIDE');
        })

    }

    showAwordPage(pageClass , data=false){
        const  page =  document.querySelector(`.${this.CLASSES[pageClass]}`);
        if (data && pageClass == 'INFO'){
            page.children[0].innerHTML = marked(data)
            this.textarea.value = data;
            this.updateLineNumbers()
        }else if(pageClass == 'NEWINFO' ){
            if (!data.dontEraseTextArea){
                this.textarea.value = '';
            }
            this.dropZone.classList.add('vcb-hidden'); //just in  case the drop is  opened 
            this.positionIndecator.classList.add('vcb-hidden'); // ....  indecator still  there
        }
        removeActiveClasses();
        page.classList.add('active');

    }

    showPanel (){
        this.floatingPanel.classList.remove('hidden');
    }
    hidePanel(){
        this.floatingPanel.classList.add('hidden');
    }

    loader(action){
        const loaderCover = document.querySelector('.vocaBoost-word-info .vcb-loading-cover');

        if (action == 'SHOW'){
            loaderCover.classList.add('show-loader')
        }else if (action ==  'HIDE'){
            loaderCover.classList.remove('show-loader')
        }
    }

    

}

export default floatingPanelState;