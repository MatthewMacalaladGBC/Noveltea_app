package com.noveltea.backend.controller;

import com.noveltea.backend.dto.ListItemDto;
import com.noveltea.backend.service.ListItemService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/list-items")
@RequiredArgsConstructor
public class ListItemController extends BaseController {

    private final ListItemService listItemService;

    // POST /list-items
    @PostMapping
    public ResponseEntity<ListItemDto.Response> addItem(
            @Valid @RequestBody ListItemDto.Request request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(listItemService.addItem(userId, request));
    }

    // GET /list-items/list/{listId}
    @GetMapping("/list/{listId}")
    public ResponseEntity<List<ListItemDto.Response>> getItemsByList(
            @PathVariable Long listId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(listItemService.getItemsByList(userId, listId));
    }

    // DELETE /list-items/{listItemId}
    @DeleteMapping("/{listItemId}")
    public ResponseEntity<Void> removeItem(
            @PathVariable Long listItemId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        listItemService.removeItem(userId, listItemId);
        return ResponseEntity.noContent().build();
    }

    // OPTIONAL (if you want reorder right now)
    // PATCH /list-items/{listItemId}/reorder?newSortOrder=2
    @PatchMapping("/{listItemId}/reorder")
    public ResponseEntity<Void> reorderItem(
            @PathVariable Long listItemId,
            @RequestParam Integer newSortOrder,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        listItemService.reorderItem(userId, listItemId, newSortOrder);
        return ResponseEntity.noContent().build();
    }
}
