
	<style>
      div {
        border: 1px solid #bcbcbc;
		background-color: aliceblue;
      }
	  #top, #footer{
		width:100%;
		height: 90px;
		margin-bottom: 10px;
		background-color: beige;
	  }

	  #table-main{
		width:80%;
		height: 470px;
		margin-bottom: 10px;
	  }

	  #table-right{
		width:20%;
		height: 470px;
		margin-bottom: 10px;
	  }

      .mainline, .middleline {
        display: table;
        width: 100%;
		margin-bottom: 10px;
      }
      .table-row {
        display: table-row;
      }
      .table-cell {
        display: table-cell;
        padding: 0px 20px;
        height: 150px;
      }

      .md-middle {
        vertical-align: middle;
      }

	</style>


	<div id="top">
		<p>top</p>
	</div>

    <div class="mainline">

      <div class="table-row">
        <div id="table-main" class="table-cell">
          <p>1(main_big)</p>
        </div>
        <div id="table-right" class="table-cell">
          <p>2(right_sub)</p>
        </div>
      </div>

    </div>

	<div class="middleline">
      <div class="table-row">
        <div class="md-middle">
          <p>5</p>
        </div>
        <div class="md-middle">
          <p>6</p>
        </div>
        <div class="md-middle">
          <p>7</p>
        </div>
        <div class="md-middle">
          <p>8</p>
        </div>
        <div class="table-cell md-middle">
          <p>9</p>
        </div>
        <div class="table-cell md-middle">
          <p>10</p>
        </div>
        <div class="md-middle">
          <p>11</p>
        </div>
        <div class="md-middle">
          <p>12</p>
        </div>
        <div class="md-middle">
          <p>13</p>
        </div>
        <div class="md-middle">
          <p>14</p>
        </div>
        <div class="table-cell md-middle">
          <p>15</p>
        </div>
        <div class="table-cell md-middle">
          <p>16</p>
        </div>
        <div class="table-cell md-middle">
          <p>17</p>
        </div>
        <div class="table-cell md-middle">
          <p>18</p>
        </div>
      </div>
	</div>

	<div id="footer">
		<p>footer</p>
	</div>
